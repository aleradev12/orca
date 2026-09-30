import { describe, expect, it } from 'vitest'
import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'
import type { FolderWorkspace } from '../../../../shared/folder-workspace-types'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import type { Project } from '../../../../shared/project-types'
import { createProjectsMatcher, filterProjectsSearch, scoreProjectsFields } from './projects-search'

const repos = [
  { id: 'app', displayName: 'Ally Service', path: '/code/payments', projectGroupId: 'child' },
  { id: 'docs', displayName: 'Documentation', path: '/writing/guide' }
] as Repo[]
const worktrees = [
  { id: 'one', repoId: 'app', branch: 'feature/billing', path: '/work/billing' },
  { id: 'two', repoId: 'app', branch: 'main', path: '/work/main' },
  { id: 'three', repoId: 'docs', branch: 'guide', path: '/work/guide' }
] as Worktree[]
const projectGroups = [
  { id: 'root', parentGroupId: null, name: 'Work', isCollapsed: true },
  { id: 'child', parentGroupId: 'root', name: 'Team', isCollapsed: true },
  { id: 'unrelated', parentGroupId: null, name: 'Other', isCollapsed: true }
] as ProjectGroup[]
const folderWorkspaces = [
  { id: 'notes', name: 'Release Notes', folderPath: '/writing/releases', projectGroupId: 'child' }
] as FolderWorkspace[]
const input = {
  repos,
  worktrees,
  projectGroups,
  folderWorkspaces,
  projects: [] as Project[],
  defaultHostId: 'local' as const
}
const search = (query: string) => filterProjectsSearch({ ...input, query })

describe('Projects fuzzy search', () => {
  it('ranks branch hits above project names, project paths and other workspace fields', () => {
    const ranked = filterProjectsSearch({
      ...input,
      query: 'orca',
      repos: [
        { id: 'path', displayName: 'Tools', path: '/code/orca/tools' },
        { id: 'name', displayName: 'Orca', path: '/code/app' },
        { id: 'branch', displayName: 'Other', path: '/code/other' }
      ] as Repo[],
      worktrees: [
        { id: 'path', repoId: 'path', branch: 'main', path: '/work/path' },
        { id: 'name', repoId: 'name', branch: 'main', path: '/work/name' },
        { id: 'branch', repoId: 'branch', branch: 'orca-pins', path: '/work/branch' }
      ] as Worktree[]
    })
    expect(ranked.worktrees.map((w) => w.id)).toEqual(['branch', 'name', 'path'])
  })
  it('orders exact, prefix, boundary, substring and scattered matches; ties stay stable', () => {
    const scores = ['orca', 'orca-pins', 'feature/orca', 'myorca', 'other-red-cyan-app'].map(
      (text) => scoreProjectsFields('orca', [{ text, priority: 0 }])!
    )
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
    expect(
      scoreProjectsFields('orca', [{ text: 'other-red-cyan-app', priority: 0 }])!
    ).toBeLessThan(scoreProjectsFields('orca', [{ text: 'orca', priority: 1 }])!)
    expect(
      scoreProjectsFields('ally billing', [
        { text: 'Ally', priority: 1 },
        { text: 'billing-fix', priority: 0 }
      ])
    ).not.toBeNull()
  })
  it('matches ordered, non-contiguous branch characters ignoring case', () => {
    expect(search('FBLG').worktrees.map((w) => w.id)).toEqual(['one'])
    expect(search('FBLG').repos.map((r) => r.id)).toEqual(['app'])
  })
  it('matches project names and root paths, showing their workspaces', () => {
    for (const query of ['ALLY', 'alysrv', '/cd/pym']) {
      expect(search(query).worktrees.map((w) => w.id)).toEqual(['one', 'two'])
      expect(search(query).repos.map((r) => r.id)).toEqual(['app'])
    }
  })
  it('supports multiple terms across fields and normalized Unicode', () => {
    expect(search('ALLY blng').worktrees.map((w) => w.id)).toEqual(['one'])
    expect(createProjectsMatcher('ПРКТ')(['Проект'])).toBe(true)
    expect(createProjectsMatcher('café')(['cafe\u0301'])).toBe(true)
    expect(createProjectsMatcher('foo/bar')(['C:\\foo\\bar'])).toBe(true)
    expect(createProjectsMatcher('ab')(['ba'])).toBe(false)
  })
  it('includes durable project display names', () => {
    const result = filterProjectsSearch({
      ...input,
      query: 'NBL',
      projects: [{ displayName: 'Nebula', sourceRepoIds: ['app'] }] as Project[]
    })
    expect(result.worktrees.map((w) => w.id)).toEqual(['one', 'two'])
  })
  it('retains only matching groups and ancestors, expanding them without mutation', () => {
    expect(search('blng').projectGroups.map((g) => [g.id, g.isCollapsed])).toEqual([
      ['root', false],
      ['child', false]
    ])
    expect(projectGroups.every((g) => g.isCollapsed)).toBe(true)
  })
  it('finds folder workspaces and empty projects', () => {
    expect(search('rlsnts').folderWorkspaces.map((f) => f.id)).toEqual(['notes'])
    expect(search('/wrt/rls').folderWorkspaces.map((f) => f.id)).toEqual(['notes'])
    expect(
      filterProjectsSearch({ ...input, worktrees: [], query: 'ALLY' }).repos.map((r) => r.id)
    ).toEqual(['app'])
  })
  it('restores original references and order for a blank query', () => {
    const result = search('  ')
    expect(result.worktrees).toBe(worktrees)
    expect(result.repos).toBe(repos)
    expect(result.projectGroups).toBe(projectGroups)
    expect(result.folderWorkspaces).toBe(folderWorkspaces)
  })
  it('returns no matches for an unknown or oversized query', () => {
    for (const query of ['zzzzzz', 'a'.repeat(257)]) {
      expect(search(query)).toMatchObject({
        worktrees: [],
        repos: [],
        projectGroups: [],
        folderWorkspaces: []
      })
    }
  })
  it('does not match a different host’s project path for the same repo id', () => {
    const result = filterProjectsSearch({
      ...input,
      query: 'secret',
      repos: [
        { ...repos[0], executionHostId: 'local', path: '/secret/local' },
        { ...repos[0], executionHostId: 'ssh:remote', path: '/public/remote' }
      ],
      worktrees: [
        { ...worktrees[0], hostId: 'local' },
        { ...worktrees[1], hostId: 'ssh:remote' }
      ]
    })
    expect(result.worktrees.map((w) => w.id)).toEqual(['one'])
    expect(result.repos.map((r) => r.executionHostId)).toEqual(['local'])
  })
})
