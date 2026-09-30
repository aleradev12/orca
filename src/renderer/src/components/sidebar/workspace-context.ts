import { parseExecutionHostId } from '../../../../shared/execution-host'
import type { Repo } from '../../../../shared/repo-types'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import type { Worktree } from '../../../../shared/worktree/types'

export function getWorkspaceContext({
  workspace,
  repo,
  groups,
  fallbackBranch = '',
  fallbackPath = ''
}: {
  workspace?: Worktree
  repo?: Repo
  groups: readonly ProjectGroup[]
  fallbackBranch?: string
  fallbackPath?: string
}) {
  const folderGroupId = workspace?.repoId.startsWith('folder-workspace:')
    ? workspace.repoId.slice('folder-workspace:'.length)
    : undefined
  const groupId = repo?.projectGroupId ?? folderGroupId
  const host = parseExecutionHostId(workspace?.hostId)
  const connectionId = repo?.connectionId ?? (host?.kind === 'ssh' ? host.targetId : null)
  const byId = new Map(
    groups
      .filter((group) => (group.connectionId ?? null) === connectionId)
      .map((group) => [group.id, group])
  )
  const ancestry: string[] = []
  const visited = new Set<string>()
  let current = groupId
  while (current && !visited.has(current)) {
    visited.add(current)
    const group = byId.get(current)
    if (!group) break
    ancestry.unshift(group.name)
    current = group.parentGroupId ?? undefined
  }
  const project = repo?.displayName || repo?.path.split(/[\\/]/).filter(Boolean).at(-1)
  if (project && ancestry.at(-1) !== project) ancestry.push(project)
  return {
    branch: (workspace?.branch || fallbackBranch || workspace?.displayName || '').replace(
      /^refs\/heads\//,
      ''
    ),
    groups: ancestry.join(' › ') || 'Project unavailable',
    path: workspace?.path ?? fallbackPath
  }
}
