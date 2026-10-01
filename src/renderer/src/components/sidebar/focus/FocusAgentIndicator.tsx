import { CircleHelp, Eye, LoaderCircle } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { selectFocusTerminalActivityStatus } from './focus-terminal-activity'
import { selectWorktreeAgentActivitySummary } from '../worktree-agent-activity-summary'
import { getFocusAgentSignal } from './focus-agent-signal'

export function FocusAgentIndicator({
  worktreeId,
  details = false
}: {
  worktreeId: string
  details?: boolean
}) {
  const status = useAppStore((state) => selectFocusTerminalActivityStatus(state, worktreeId))
  const summary = useAppStore((state) => selectWorktreeAgentActivitySummary(state, worktreeId))
  const signal = getFocusAgentSignal(status, summary)
  if (!signal) {
    return null
  }
  const Icon =
    signal.kind === 'working' ? LoaderCircle : signal.kind === 'waiting' ? CircleHelp : Eye
  return (
    <span
      data-focus-agent={signal.kind}
      role="img"
      aria-label={signal.label}
      className={cn(
        'inline-flex shrink-0 items-center gap-1',
        signal.kind === 'waiting'
          ? 'text-amber-500'
          : signal.kind === 'working'
            ? 'text-foreground'
            : 'text-blue-500 dark:text-blue-400'
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'size-3',
          signal.kind === 'working' && 'animate-spin motion-reduce:animate-none'
        )}
      />
      {details && <span>{signal.label}</span>}
    </span>
  )
}
