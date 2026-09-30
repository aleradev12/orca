import type { HostSectionRow } from './host-section-rows'
import type { Worktree } from '../../../../shared/worktree/types'
import type { FolderWorkspace } from '../../../../shared/folder-workspace-types'

// Global relevance must win over saved project grouping, lineage and pinning.
export function rankProjectsSearchRows(
  rows: HostSectionRow[],
  worktreeScores: ReadonlyMap<Worktree, number>,
  folderScores: ReadonlyMap<FolderWorkspace, number>
): HostSectionRow[] {
  const seen = new Set<string>()
  const result: HostSectionRow[] = []
  for (const row of rows) {
    if (row.type === 'host-header') {
      continue
    }
    if (row.type === 'header' && (!row.repo || row.count !== 0)) {
      continue
    }
    if (row.type === 'item') {
      if (seen.has(row.rowKey)) {
        continue
      }
      seen.add(row.rowKey)
      result.push({
        ...row,
        depth: 0,
        groupDepth: 0,
        lineageTrail: [],
        lineageChildCount: 0,
        lineageCollapsed: false,
        searchProjectLabel: row.repo?.displayName || 'Project unavailable'
      })
    } else if (row.type === 'folder-workspace') {
      result.push({ ...row, depth: 0, groupDepth: 0, searchProjectLabel: row.projectGroup.name })
    } else {
      result.push(row)
    }
  }
  const score = (row: HostSectionRow) =>
    row.type === 'item'
      ? (worktreeScores.get(row.worktree) ?? Number.MAX_SAFE_INTEGER)
      : row.type === 'folder-workspace'
        ? (folderScores.get(row.folderWorkspace) ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER
  return result.sort((a, b) => score(a) - score(b))
}
