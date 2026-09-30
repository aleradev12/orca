import { describe, expect, it } from 'vitest'
import type { Worktree } from '../../../../shared/worktree/types'
import type { Repo } from '../../../../shared/repo-types'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import { getWorkspaceContext } from './workspace-context'
import { filterProjectsSearch } from './projects-search'

const workspace = {
  branch: 'sber',
  displayName: 'Custom label',
  path: '/projects/orca/worktrees/sber',
  repoId: 'repo'
} as Worktree
const repo = {
  id: 'repo',
  displayName: 'orca',
  path: '/projects/orca',
  projectGroupId: 'child',
  connectionId: null
} as Repo
const groups = [
  { id: 'root', name: 'Projects', parentGroupId: null, connectionId: null },
  { id: 'child', name: '🟩 sber', parentGroupId: 'root', connectionId: null }
] as ProjectGroup[]

describe('workspace context', () => {
  it('shows branch rather than custom label, complete group ancestry, project and workspace path', () => {
    expect(getWorkspaceContext({ workspace, repo, groups })).toEqual({
      branch: 'sber',
      groups: 'Projects › 🟩 sber › orca',
      path: workspace.path
    })
  })
  it('uses the visible branch name for canonical Git refs', () => {
    expect(
      getWorkspaceContext({ workspace: { ...workspace, branch: 'refs/heads/sber' }, repo, groups })
        .branch
    ).toBe('sber')
  })
  it('finds branches by their group context, even when the path and branch do not contain the query', () => {
    const branch = {
      ...workspace,
      branch: 'fix/context',
      displayName: '',
      path: '/projects/orca/worktrees/context'
    }
    const result = filterProjectsSearch({
      query: 'sber',
      worktrees: [branch],
      repos: [repo],
      projectGroups: groups.map((group) => ({ ...group, parentPath: '/projects' })),
      folderWorkspaces: [],
      projects: [],
      defaultHostId: 'local'
    })
    expect(result.worktrees).toEqual([branch])
  })
  it('stops broken/cyclic ancestry and does not invent missing groups', () => {
    expect(
      getWorkspaceContext({ workspace, repo, groups: [{ ...groups[1], parentGroupId: 'child' }] })
        .groups
    ).toBe('🟩 sber › orca')
    expect(getWorkspaceContext({ workspace, repo, groups: [] }).groups).toBe('orca')
  })
  it('does not use local groups for a remote project with the same IDs', () => {
    expect(
      getWorkspaceContext({ workspace, repo: { ...repo, connectionId: 'ssh' }, groups }).groups
    ).toBe('orca')
  })
  it('uses Windows basenames and saved information for an unavailable pin', () => {
    expect(
      getWorkspaceContext({
        repo: { ...repo, displayName: '', path: 'C:\\projects\\orca' },
        groups: [],
        fallbackBranch: 'saved',
        fallbackPath: 'C:\\worktrees\\saved'
      })
    ).toEqual({ branch: 'saved', groups: 'orca', path: 'C:\\worktrees\\saved' })
  })
  it('resolves folder context ancestry without repeating the folder title', () => {
    expect(
      getWorkspaceContext({
        workspace: {
          ...workspace,
          repoId: 'folder-workspace:child',
          branch: '',
          displayName: 'Folder workspace'
        },
        groups
      }).groups
    ).toBe('Projects › 🟩 sber')
  })
})
