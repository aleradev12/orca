import type { AppState } from '@/store'
import type { WorktreeStatus } from '@/lib/worktree-status'
import { resolveTerminalTabActivityStatus } from '../../tab-bar/terminal-tab-activity-status'

export type FocusTerminalActivityInput = Pick<
  AppState,
  | 'tabsByWorktree'
  | 'agentStatusByPaneKey'
  | 'agentStatusEpoch'
  | 'runtimePaneTitlesByTabId'
  | 'ptyIdsByTabId'
  | 'terminalLayoutsByTabId'
>

/** Use the same evidence/liveness/layout resolver as the terminal tab glyph. */
export function selectFocusTerminalActivityStatus(
  state: FocusTerminalActivityInput,
  worktreeId: string
): WorktreeStatus {
  let waiting = false
  let monitoring = false
  for (const tab of state.tabsByWorktree[worktreeId] ?? []) {
    const status = resolveTerminalTabActivityStatus({
      tab,
      agentStatusByPaneKey: state.agentStatusByPaneKey,
      agentStatusEpoch: state.agentStatusEpoch,
      runtimePaneTitlesByTabId: state.runtimePaneTitlesByTabId,
      ptyIdsByTabId: state.ptyIdsByTabId,
      terminalLayout: state.terminalLayoutsByTabId?.[tab.id]
    })
    if (status === 'working') {
      return 'working'
    }
    waiting ||= status === 'permission'
    monitoring ||= status === 'monitoring'
  }
  return waiting ? 'permission' : monitoring ? 'monitoring' : 'inactive'
}
