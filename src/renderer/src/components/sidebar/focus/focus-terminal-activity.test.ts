import { describe, expect, it } from 'vitest'
import type { TerminalTab } from '../../../../../shared/terminal-tab-types'
import {
  selectFocusTerminalActivityStatus,
  type FocusTerminalActivityInput
} from './focus-terminal-activity'
const tab = (id: string, title: string) => ({ id, title }) as TerminalTab
function fixture(tabs: TerminalTab[]): FocusTerminalActivityInput {
  return {
    tabsByWorktree: { workspace: tabs },
    agentStatusByPaneKey: {},
    agentStatusEpoch: 0,
    runtimePaneTitlesByTabId: {},
    ptyIdsByTabId: Object.fromEntries(tabs.map((t) => [t.id, [`pty-${t.id}`]])),
    terminalLayoutsByTabId: {}
  }
}
describe('Focus matches native terminal-tab activity', () => {
  it('accepts a live tab title without any hook row', () => {
    expect(
      selectFocusTerminalActivityStatus(fixture([tab('a', 'Codex working')]), 'workspace')
    ).toBe('working')
  })
  it('does not resurrect a title after PTY exit', () => {
    const state = fixture([tab('a', 'Codex working')])
    state.ptyIdsByTabId = {}
    expect(selectFocusTerminalActivityStatus(state, 'workspace')).toBe('inactive')
  })
  it('does not treat an open Pi shell/agent as a running turn', () => {
    expect(
      selectFocusTerminalActivityStatus(fixture([tab('a', 'Pi - workspace')]), 'workspace')
    ).toBe('inactive')
  })
  it('keeps another tab worker visible beside a permission request', () => {
    const state = fixture([tab('a', 'Codex - action required'), tab('b', 'Codex working')])
    expect(selectFocusTerminalActivityStatus(state, 'workspace')).toBe('working')
  })
  it('does not use tabs belonging to another workspace', () => {
    expect(selectFocusTerminalActivityStatus(fixture([tab('a', 'Codex working')]), 'other')).toBe(
      'inactive'
    )
  })
})
