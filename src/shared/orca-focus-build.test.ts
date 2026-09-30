import { describe, expect, it } from 'vitest'
import { getFocusProfileName, ORCA_FOCUS_PROFILE } from './orca-focus-build'

describe('Focus distribution profile isolation', () => {
  it('preserves the production profile identity', () => {
    expect(getFocusProfileName(false)).toBe(ORCA_FOCUS_PROFILE)
  })
  it('never selects the packaged primary profile for a development build', () => {
    expect(getFocusProfileName(true)).toBe(`${ORCA_FOCUS_PROFILE}-dev`)
    expect(getFocusProfileName(true)).not.toBe('orca-focus')
    expect(getFocusProfileName(true)).not.toBe('orca-focus-test')
  })
})
