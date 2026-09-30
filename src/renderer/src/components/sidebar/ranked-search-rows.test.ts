import { describe, expect, it } from 'vitest'
import type { HostSectionRow } from './host-section-rows'
import type { Worktree } from '../../../../shared/worktree/types'
import { rankProjectsSearchRows } from './ranked-search-rows'

describe('globally ranked Projects search rows', () => {
  it('puts the best branch above other projects and pinned/lineage rows, removing duplicates', () => {
    const path = { id: 'path' } as Worktree
    const branch = { id: 'branch' } as Worktree
    const item = (worktree: Worktree, sectionKey: string) =>
      ({
        type: 'item',
        worktree,
        rowKey: worktree.id,
        repo: { displayName: `${worktree.id} project` },
        sectionKey,
        depth: 2,
        groupDepth: 2,
        lineageChildCount: 2,
        lineageTrail: [true]
      }) as HostSectionRow
    const rows = [
      { type: 'header', key: 'pinned', count: 1 },
      item(path, 'pinned'),
      { type: 'header', key: 'project-a', count: 1 },
      item(path, 'a'),
      { type: 'header', key: 'project-b', count: 1 },
      item(branch, 'b'),
      { type: 'header', key: 'empty', count: 0, repo: { id: 'empty' } },
      { type: 'folder-workspace', key: 'folder' },
      { type: 'host-header', key: 'host' },
      { type: 'imported-worktrees-card', key: 'inbox' },
      { type: 'pending-creation', key: 'pending' }
    ] as HostSectionRow[]
    const result = rankProjectsSearchRows(
      rows,
      new Map([
        [branch, 100],
        [path, 2_000_000]
      ]),
      new Map()
    )
    expect(result.map((row) => (row.type === 'item' ? row.worktree.id : row.key))).toEqual([
      'branch',
      'path'
    ])
    expect(result[0]).toMatchObject({
      depth: 0,
      lineageChildCount: 0,
      lineageTrail: [],
      searchProjectLabel: 'branch project'
    })
    expect(result[1]).toMatchObject({ searchProjectLabel: 'path project' })
    expect(rows[1]).not.toHaveProperty('searchProjectLabel')
    expect(rows[1]).toMatchObject({ depth: 2, lineageChildCount: 2 })
  })
})
