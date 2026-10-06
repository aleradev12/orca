import { describe, expect, it, vi } from 'vitest'
import { ORCA_FOCUS_BUILD } from '../../shared/orca-focus-build'

vi.mock('electron', () => ({ app: { isPackaged: false } }))

import { shouldInstallManagedHooks } from './configure-process'
import {
  resolveStartupManagedHookAction,
  shouldInstallStartupManagedAgentHook
} from '../agent-hooks/managed-agent-hook-controls'

describe('Focus uses the upstream agent hook startup policy', () => {
  it('does not disable hooks in packaged or development Focus builds', () => {
    expect(ORCA_FOCUS_BUILD).toBe(true)
    expect(shouldInstallManagedHooks(false)).toBe(true)
    expect(shouldInstallManagedHooks(true)).toBe(true)
  })

  it('still respects a user opt-out instead of silently overriding the profile', () => {
    expect(resolveStartupManagedHookAction({ agentStatusHooksEnabled: false })).toBe('skip')
    expect(resolveStartupManagedHookAction({ agentStatusHooksEnabled: true })).toBe('install')
    expect(resolveStartupManagedHookAction(null)).toBe('install')
  })

  it('keeps disabled-agent controls intact', () => {
    expect(
      shouldInstallStartupManagedAgentHook(
        { agentStatusHooksEnabled: true, disabledTuiAgents: ['claude'] },
        'claude'
      )
    ).toBe(false)
    expect(shouldInstallStartupManagedAgentHook({ agentStatusHooksEnabled: true }, 'codex')).toBe(
      true
    )
  })
})
