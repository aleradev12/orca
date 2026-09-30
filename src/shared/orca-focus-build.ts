// Local side-by-side distribution; never allow production registration or updates.
export const ORCA_FOCUS_BUILD = true
// The packaged executable determines the distribution, including when launched via Finder.
export const ORCA_FOCUS_TEST_BUILD = process.execPath.includes('/Orca Focus Test.app/')
export const ORCA_FOCUS_APP_NAME = ORCA_FOCUS_TEST_BUILD ? 'Orca Focus Test' : 'Orca Focus'
export const ORCA_FOCUS_APP_ID = ORCA_FOCUS_TEST_BUILD
  ? 'local.orca.focus.test'
  : 'local.orca.focus'
export const ORCA_FOCUS_PROFILE = ORCA_FOCUS_TEST_BUILD ? 'orca-focus-test' : 'orca-focus'
