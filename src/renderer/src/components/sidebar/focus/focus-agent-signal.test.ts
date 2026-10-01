import { describe, expect, it } from 'vitest'
import { getFocusAgentSignal } from './focus-agent-signal'
const empty = { hasLiveWorking: false, hasPermission: false, hasLiveMonitoring: false }
describe('Focus native agent signal', () => {
  for (const status of ['active', 'done', 'inactive'] as const) {
    it(`does not treat ${status} as working`, () =>
      expect(getFocusAgentSignal(status, empty)).toBeNull())
  }
  it('uses native title-derived working status', () => {
    expect(getFocusAgentSignal('working', empty)?.kind).toBe('working')
  })
  it('does not mask a live worker when another agent is waiting', () => {
    expect(
      getFocusAgentSignal('permission', { ...empty, hasLiveWorking: true, hasPermission: true })
    ).toEqual({ kind: 'working', label: 'Agent working · Another agent needs input' })
  })
  it('distinguishes waiting from active computation', () => {
    expect(getFocusAgentSignal('permission', empty)?.kind).toBe('waiting')
  })
  it('distinguishes monitoring from working', () => {
    expect(getFocusAgentSignal('monitoring', empty)?.kind).toBe('monitoring')
  })
  it('accepts the explicit native live-working summary', () => {
    expect(getFocusAgentSignal('active', { ...empty, hasLiveWorking: true })?.kind).toBe('working')
  })
})
