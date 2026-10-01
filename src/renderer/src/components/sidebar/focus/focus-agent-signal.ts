import type { WorktreeStatus } from '@/lib/worktree-status'
import type { WorktreeAgentActivitySummary } from '../worktree-agent-activity-summary'

export function getFocusAgentSignal(
  status: WorktreeStatus,
  summary: Pick<
    WorktreeAgentActivitySummary,
    'hasLiveWorking' | 'hasPermission' | 'hasLiveMonitoring'
  >
): { kind: 'working' | 'waiting' | 'monitoring'; label: string } | null {
  const waiting = summary.hasPermission || status === 'permission'
  // A waiting pane must not conceal another pane's working agent.
  if (summary.hasLiveWorking || status === 'working') {
    return {
      kind: 'working',
      label: waiting ? 'Agent working · Another agent needs input' : 'Agent working'
    }
  }
  if (waiting) {
    return { kind: 'waiting', label: 'Agent needs input' }
  }
  if (summary.hasLiveMonitoring || status === 'monitoring') {
    return { kind: 'monitoring', label: 'Agent monitoring' }
  }
  // Open shells, browser tabs and completed agents are not live work signals.
  return null
}
