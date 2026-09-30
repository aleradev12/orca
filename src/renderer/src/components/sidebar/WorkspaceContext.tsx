import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { getRepoExecutionHostId } from '../../../../shared/execution-host'
import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'
import { getWorkspaceContext } from './workspace-context'

export function WorkspaceContext({
  workspace,
  repo,
  fallbackBranch,
  fallbackPath,
  showBranch = false,
  compact = false
}: {
  workspace?: Worktree
  repo?: Repo
  fallbackBranch?: string
  fallbackPath?: string
  showBranch?: boolean
  compact?: boolean
}) {
  const repos = useAppStore((state) => state.repos)
  const groups = useAppStore((state) => state.projectGroups)
  const context = useMemo(() => {
    const owner =
      repo ??
      repos.find(
        (candidate) =>
          candidate.id === workspace?.repoId &&
          (!workspace.hostId || getRepoExecutionHostId(candidate) === workspace.hostId)
      )
    return getWorkspaceContext({ workspace, repo: owner, groups, fallbackBranch, fallbackPath })
  }, [workspace, repo, repos, groups, fallbackBranch, fallbackPath])
  return (
    <span
      data-workspace-context
      className={cn(
        'flex min-w-0 flex-col text-muted-foreground',
        compact ? 'text-[10px] leading-3' : 'text-[11px] leading-4'
      )}
    >
      {showBranch && (
        <span data-workspace-context-branch className="truncate" title={context.branch}>
          {context.branch}
        </span>
      )}
      <span data-workspace-context-groups className="truncate" title={context.groups}>
        {context.groups}
      </span>
      <span
        data-workspace-context-path
        className={cn('block truncate text-left', compact ? 'text-[9px]' : 'text-[10px]')}
        dir="rtl"
        title={context.path}
      >
        <bdi dir="ltr">{context.path}</bdi>
      </span>
    </span>
  )
}
