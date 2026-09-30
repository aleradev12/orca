import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { activateAndRevealWorktree } from '@/lib/worktree-activation'
import { resolveWorktreeDisplayName } from '@/lib/worktree-default-display-name'
import type { Worktree } from '../../../shared/worktree/types'

/** Announces a create that finished after the user left its creation surface, instead of pulling them to it. */
export function showWorktreeCreationReadyToast(
  worktree: Pick<Worktree, 'id' | 'displayName' | 'branch' | 'path'>
): void {
  toast.success(
    translate('components.workspace.creation.readyToast', '{{name}} is ready', {
      name: resolveWorktreeDisplayName(worktree)
    }),
    {
      action: {
        label: translate('components.workspace.creation.openReady', 'Open'),
        onClick: () => {
          activateAndRevealWorktree(worktree.id, {
            sidebarRevealBehavior: 'auto',
            navigationIntent: 'user-open'
          })
        }
      }
    }
  )
}
