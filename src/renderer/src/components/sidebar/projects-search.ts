import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'
import type { FolderWorkspace } from '../../../../shared/folder-workspace-types'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import type { Project } from '../../../../shared/project-types'
import { getRepoExecutionHostId, type ExecutionHostId } from '../../../../shared/execution-host'

export const PROJECTS_SEARCH_MAX_LENGTH = 256
const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/\\/g, '/')

type SearchField = { text: string; priority: number }

function scoreCandidate(term: string, text: string): number | null {
  const candidate = normalize(text)
  if (candidate === term) {
    return 0
  }
  if (candidate.startsWith(term)) {
    return 100 + Math.min(candidate.length - term.length, 99)
  }
  const contiguous = candidate.indexOf(term)
  if (contiguous !== -1) {
    const boundary = /[\s/_.-]/.test(candidate[contiguous - 1] ?? '')
    return (boundary ? 300 : 500) + Math.min(contiguous, 99)
  }
  let position = 0
  let first = -1
  let last = -1
  for (const character of term) {
    const index = candidate.indexOf(character, position)
    if (index === -1) {
      return null
    }
    if (first === -1) {
      first = index
    }
    last = index
    position = index + character.length
  }
  return 1000 + Math.min(last - first - term.length + 1, 999) + Math.min(first, 99)
}

// Field priority dominates match quality; weakest multi-word field determines the tier.
export function scoreProjectsFields(query: string, fields: readonly SearchField[]): number | null {
  if (query.length > PROJECTS_SEARCH_MAX_LENGTH) {
    return null
  }
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  let tier = 0
  let quality = 0
  for (const term of terms) {
    let best: { priority: number; quality: number } | null = null
    for (const field of fields) {
      const score = scoreCandidate(term, field.text)
      if (
        score !== null &&
        (!best ||
          field.priority < best.priority ||
          (field.priority === best.priority && score < best.quality))
      ) {
        best = { priority: field.priority, quality: score }
      }
    }
    if (!best) {
      return null
    }
    tier = Math.max(tier, best.priority)
    quality += best.quality
  }
  return tier * 1_000_000 + quality
}

// Ordered, non-contiguous characters; each term can match a different field.
export function createProjectsMatcher(query: string): (fields: readonly string[]) => boolean {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  if (query.length > PROJECTS_SEARCH_MAX_LENGTH) {
    return () => false
  }
  return (fields) => {
    const candidates = fields.map(normalize)
    return terms.every((term) =>
      candidates.some((candidate) => {
        let position = 0
        for (const character of term) {
          const index = candidate.indexOf(character, position)
          if (index === -1) {
            return false
          }
          position = index + character.length
        }
        return true
      })
    )
  }
}

export function filterProjectsSearch({
  query,
  worktrees,
  repos,
  projectGroups,
  folderWorkspaces,
  projects,
  defaultHostId
}: {
  query: string
  worktrees: Worktree[]
  repos: readonly Repo[]
  projectGroups: readonly ProjectGroup[]
  folderWorkspaces: readonly FolderWorkspace[]
  projects: readonly Project[]
  defaultHostId: ExecutionHostId
}) {
  if (!query.trim()) {
    return {
      worktrees,
      repos,
      projectGroups,
      folderWorkspaces,
      worktreeScores: new Map<Worktree, number>(),
      folderScores: new Map<FolderWorkspace, number>()
    }
  }
  const matches = createProjectsMatcher(query)
  const projectNameByRepo = new Map(
    projects.flatMap((project) =>
      project.sourceRepoIds.map((id) => [id, project.displayName] as const)
    )
  )
  const repoFields = (repo: Repo) => [
    repo.displayName,
    repo.path,
    projectNameByRepo.get(repo.id) ?? ''
  ]
  const repoHost = (repo: Repo) =>
    repo.connectionId || repo.executionHostId ? getRepoExecutionHostId(repo) : defaultHostId
  const reposById = new Map<string, Repo[]>()
  for (const repo of repos) {
    reposById.set(repo.id, [...(reposById.get(repo.id) ?? []), repo])
  }
  const keptRepos = new Set(repos.filter((repo) => matches(repoFields(repo))))
  const worktreeScores = new Map<Worktree, number>()
  const folderScores = new Map<FolderWorkspace, number>()
  const filteredWorktrees = worktrees.filter((worktree) => {
    const candidates = reposById.get(worktree.repoId) ?? []
    const repo = worktree.hostId
      ? candidates.find((candidate) => repoHost(candidate) === worktree.hostId)
      : candidates[0]
    const score = scoreProjectsFields(query, [
      { text: worktree.branch, priority: 0 },
      { text: repo?.displayName ?? '', priority: 1 },
      { text: repo ? (projectNameByRepo.get(repo.id) ?? '') : '', priority: 1 },
      { text: repo?.path ?? '', priority: 2 },
      { text: worktree.displayName ?? '', priority: 3 },
      { text: worktree.path, priority: 4 }
    ])
    const keep = score !== null
    if (score !== null) {
      worktreeScores.set(worktree, score)
    }
    if (keep && repo) {
      keptRepos.add(repo)
    }
    return keep
  })
  const groupsById = new Map(projectGroups.map((group) => [group.id, group]))
  const filteredFolders = folderWorkspaces.filter((folder) => {
    const group = groupsById.get(folder.projectGroupId)
    const score = scoreProjectsFields(query, [
      { text: folder.name, priority: 0 },
      { text: group?.name ?? '', priority: 1 },
      { text: group?.parentPath ?? '', priority: 2 },
      { text: folder.folderPath, priority: 4 }
    ])
    if (score !== null) {
      folderScores.set(folder, score)
    }
    return score !== null
  })
  const keptGroups = new Set<string>()
  const retainAncestors = (id: string | null | undefined) => {
    while (id && !keptGroups.has(id)) {
      keptGroups.add(id)
      id = groupsById.get(id)?.parentGroupId
    }
  }
  for (const repo of keptRepos) {
    retainAncestors(repo.projectGroupId)
  }
  for (const folder of filteredFolders) {
    retainAncestors(folder.projectGroupId)
  }
  return {
    worktrees: filteredWorktrees.sort((a, b) => worktreeScores.get(a)! - worktreeScores.get(b)!),
    worktreeScores,
    folderScores,
    repos: repos.filter((repo) => keptRepos.has(repo)),
    // Temporary expansion: clearing the query restores the saved group layout.
    projectGroups: projectGroups
      .filter((group) => keptGroups.has(group.id))
      .map((group) => ({ ...group, isCollapsed: false })),
    folderWorkspaces: filteredFolders.sort((a, b) => folderScores.get(a)! - folderScores.get(b)!)
  }
}
