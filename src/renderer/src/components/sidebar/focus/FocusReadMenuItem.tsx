import { Bell, BellOff } from 'lucide-react'
import { ContextMenuItem } from '@/components/ui/context-menu'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import type { ExecutionHostId } from '../../../../../shared/execution-host'
import type { Worktree } from '../../../../../shared/worktree/types'

export function FocusReadMenuItem({
  workspace,
  executionHostId
}: {
  workspace?: Worktree
  executionHostId: ExecutionHostId
}) {
  const updateWorktreeMeta = useAppStore((state) => state.updateWorktreeMeta)
  const available = Boolean(workspace && !workspace.isArchived)
  return (
    <ContextMenuItem
      disabled={!available}
      onSelect={() => {
        if (workspace && available) {
          void updateWorktreeMeta(
            workspace.id,
            { isUnread: !workspace.isUnread },
            { executionHostId }
          )
        }
      }}
    >
      {workspace?.isUnread ? <BellOff className="size-3.5" /> : <Bell className="size-3.5" />}
      {workspace?.isUnread
        ? translate('auto.components.sidebar.WorktreeContextMenu.8dacff1fe0', 'Mark Read')
        : translate('auto.components.sidebar.WorktreeContextMenu.f50603c6b2', 'Mark Unread')}
    </ContextMenuItem>
  )
}
