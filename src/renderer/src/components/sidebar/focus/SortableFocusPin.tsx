import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { PinOff } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { activateWorktreeFromSidebar } from '@/lib/sidebar-worktree-activation'
import { cn } from '@/lib/utils'
import type { Worktree } from '../../../../../shared/worktree/types'
import {
  getExecutionHostIdFromWorktreeHostIdentity,
  getWorktreeIdFromHostIdentity
} from '../../../../../shared/worktree/host-qualified-identity'
import { FocusPicker } from './FocusPicker'
import type { FocusDocument, FocusPin } from './focus-state'
import { useFocusStore } from './use-focus-store'
import { FocusUnreadIndicator } from './FocusUnreadIndicator'
import { WorkspaceContext } from '../WorkspaceContext'

export function SortableFocusPin({
  pin,
  workspace,
  mode,
  current
}: {
  pin: FocusPin
  workspace?: Worktree
  mode: FocusDocument['mode']
  current: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const removePin = useFocusStore((state) => state.removePin)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pin.identity,
    disabled: menuOpen
  })
  const available = Boolean(workspace && !workspace.isArchived)
  const label = pin.label || workspace?.displayName || workspace?.branch || pin.name
  return (
    <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <Tooltip open={isDragging || menuOpen ? false : undefined}>
        <ContextMenuTrigger asChild>
          <TooltipTrigger asChild>
            <button
              ref={setNodeRef}
              {...attributes}
              {...listeners}
              type="button"
              aria-label={label}
              aria-disabled={!available}
              aria-current={current ? 'page' : undefined}
              data-current={current}
              data-focus-identity={pin.identity}
              style={{
                transform:
                  transform && !isDragging
                    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
                    : undefined,
                transition
              }}
              className={cn(
                'relative min-w-0 touch-none select-none rounded-md text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring motion-reduce:transition-none!',
                mode === 'grid'
                  ? 'flex aspect-square items-center justify-center text-xl'
                  : 'flex min-h-14 shrink-0 items-center gap-2 px-2 py-1.5 text-left text-[13px]',
                current && 'bg-sidebar-accent ring-1 ring-inset ring-sidebar-ring',
                !available && 'opacity-50',
                isDragging && 'z-10 cursor-grabbing bg-sidebar-accent opacity-30'
              )}
              onClick={() => {
                if (available && !isDragging) {
                  void activateWorktreeFromSidebar(
                    getWorktreeIdFromHostIdentity(pin.identity),
                    getExecutionHostIdFromWorktreeHostIdentity(pin.identity)
                  )
                }
              }}
            >
              <span aria-hidden="true" className="shrink-0">
                {pin.emoji}
              </span>
              {mode === 'list' && (
                <span className="flex min-w-0 flex-1 flex-col pr-3">
                  <span className="truncate leading-4">{label}</span>
                  <WorkspaceContext
                    workspace={workspace}
                    fallbackBranch={pin.name}
                    fallbackPath={pin.path}
                    showBranch
                    showTitles={false}
                    compact
                  />
                </span>
              )}
              {available && workspace && (
                <span
                  className={cn(
                    'pointer-events-none absolute right-1',
                    mode === 'grid' ? 'bottom-1' : 'top-2'
                  )}
                >
                  <FocusUnreadIndicator isUnread={workspace.isUnread} />
                </span>
              )}
            </button>
          </TooltipTrigger>
        </ContextMenuTrigger>
        <TooltipContent side="right" variant="surface">
          <div>{label}</div>
          <WorkspaceContext
            workspace={workspace}
            fallbackBranch={pin.name}
            fallbackPath={pin.path}
            showBranch
            showTitles={false}
          />
          {workspace?.isUnread && <div>Unread</div>}
          {!available && <div>Workspace unavailable · right-click to edit or Unfocus</div>}
        </TooltipContent>
      </Tooltip>
      <ContextMenuContent
        className="max-h-[80vh] overflow-y-auto scrollbar-sleek"
        onKeyDown={(event) => {
          if (event.key !== 'Escape') {
            event.stopPropagation()
          }
        }}
      >
        <ContextMenuLabel>Edit Focus</ContextMenuLabel>
        <FocusPicker pin={pin} onSaved={() => setMenuOpen(false)} />
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => removePin(pin.identity)}>
          <PinOff className="size-3.5" />
          Unfocus
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
