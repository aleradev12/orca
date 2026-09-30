import { Focus, PinOff } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store'
import type { Worktree } from '../../../../../shared/worktree/types'
import type { Repo } from '../../../../../shared/repo-types'
import { getRepoExecutionHostId } from '../../../../../shared/execution-host'
import { composeWorktreeHostIdentity } from '../../../../../shared/worktree/host-qualified-identity'
import { FocusPicker } from './FocusPicker'
import { useFocusStore } from './use-focus-store'

export function FocusWorkspaceMenu({
  worktree,
  repo,
  disabled,
  onSaved
}: {
  worktree: Worktree
  repo?: Repo | null
  disabled: boolean
  onSaved: () => void
}) {
  const profileId = useAppStore((state) => state.activeOrcaProfileId)
  const hostId = worktree.hostId ?? (repo ? getRepoExecutionHostId(repo) : 'local')
  const identity = composeWorktreeHostIdentity(hostId, worktree.id)
  const existing = useFocusStore((state) => state.pins.find((pin) => pin.identity === identity))
  const removePin = useFocusStore((state) => state.removePin)
  const pin = existing ?? {
    identity,
    emoji: '🔵',
    label: '',
    name: worktree.displayName || worktree.branch || worktree.path,
    path: worktree.path
  }
  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={disabled || !profileId}>
          <Focus className="size-3.5" />
          {existing ? 'Edit Focus' : 'Focus'}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          className="max-h-[80vh] overflow-y-auto scrollbar-sleek"
          onKeyDown={(event) => {
            // Let form controls own arrows/typing instead of Radix menu typeahead.
            if (event.key !== 'Escape') {
              event.stopPropagation()
            }
          }}
        >
          <FocusPicker pin={pin} onSaved={onSaved} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {existing && (
        <DropdownMenuItem onSelect={() => removePin(identity)}>
          <PinOff className="size-3.5" />
          Unfocus
        </DropdownMenuItem>
      )}
    </>
  )
}
