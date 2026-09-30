import { describe, expect, it } from 'vitest'
import { createFocusStore, decodeFocusDocument, type FocusPin } from './focus-state'

const pin: FocusPin = {
  identity: 'local|repo::/work/feature',
  emoji: '🟢',
  label: 'Ally',
  name: 'feature',
  path: '/work/feature'
}
function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    }
  }
}
describe('Focus persistence', () => {
  it('restores emoji, label, identity and display mode after restart', () => {
    const storage = memoryStorage()
    const store = createFocusStore(storage, 'profile-a')
    expect(store.getState().savePin(pin)).toBe(true)
    store.getState().setMode('list')
    expect(createFocusStore(storage, 'profile-a').getState()).toMatchObject({
      pins: [pin],
      mode: 'list'
    })
  })
  it('updates a pin in place without duplicates or changing order', () => {
    const store = createFocusStore(memoryStorage(), 'a')
    store.getState().savePin(pin)
    store.getState().savePin({ ...pin, identity: 'local|other' })
    store.getState().savePin({ ...pin, emoji: '🚀', label: 'New' })
    expect(store.getState().pins.map((p) => [p.identity, p.emoji])).toEqual([
      [pin.identity, '🚀'],
      ['local|other', '🟢']
    ])
  })
  it('keeps identical workspace ids on different hosts separate', () => {
    const store = createFocusStore(memoryStorage(), 'a')
    store.getState().savePin(pin)
    const remote = { ...pin, identity: 'ssh:server|repo::/work/feature' }
    store.getState().savePin(remote)
    store.getState().removePin(pin.identity)
    expect(store.getState().pins).toEqual([remote])
  })
  it('isolates Orca profiles', () => {
    const storage = memoryStorage()
    createFocusStore(storage, 'a').getState().savePin(pin)
    expect(createFocusStore(storage, 'b').getState().pins).toEqual([])
  })
  it('does not clear saved data on a bad document', () => {
    const storage = memoryStorage()
    storage.setItem('a', '{invalid')
    expect(createFocusStore(storage, 'a').getState().error).toContain('Could not load')
    expect(storage.getItem('a')).toBe('{invalid')
    expect(() => decodeFocusDocument('{"version":2}')).toThrow()
  })
  it('does not report an unsaved change as persisted', () => {
    const store = createFocusStore(
      {
        getItem: () => null,
        setItem: () => {
          throw new Error('quota')
        }
      },
      'a'
    )
    expect(store.getState().savePin(pin)).toBe(false)
    expect(store.getState().pins).toEqual([])
    expect(store.getState().error).toContain('Could not save')
  })
  it('validates identities and supports folder workspace keys', () => {
    const store = createFocusStore(memoryStorage(), 'a')
    expect(store.getState().savePin({ ...pin, identity: '|ambiguous' })).toBe(false)
    expect(store.getState().savePin({ ...pin, identity: 'local|folder:notes' })).toBe(true)
  })
  it('restores reordered pins and Projects collapse without losing other preferences', () => {
    const storage = memoryStorage()
    const store = createFocusStore(storage, 'a')
    for (const identity of ['local|a', 'local|b', 'local|c']) {
      store.getState().savePin({ ...pin, identity })
    }
    store.getState().setProjectsCollapsed(true)
    store.getState().setMode('list')
    expect(store.getState().movePin('local|a', 'local|c')).toBe(true)
    expect(store.getState().pins.map((pin) => pin.identity)).toEqual([
      'local|b',
      'local|c',
      'local|a'
    ])
    store.getState().savePin({ ...pin, identity: 'local|c', label: 'Edited' })
    const restored = createFocusStore(storage, 'a').getState()
    expect(restored.pins.map((pin) => pin.identity)).toEqual(['local|b', 'local|c', 'local|a'])
    expect(restored.pins[1].label).toBe('Edited')
    expect(restored).toMatchObject({ mode: 'list', projectsCollapsed: true })
    expect(restored.movePin('local|a', 'local|b')).toBe(true)
    expect(
      createFocusStore(storage, 'a')
        .getState()
        .pins.map((pin) => pin.identity)
    ).toEqual(['local|a', 'local|b', 'local|c'])
  })
  it('migrates existing Focus documents with Projects expanded', () => {
    expect(decodeFocusDocument(JSON.stringify({ version: 1, mode: 'grid', pins: [pin] }))).toEqual({
      version: 1,
      mode: 'grid',
      pins: [pin],
      projectsCollapsed: false
    })
  })
  it('ignores stale drag targets and no-op moves', () => {
    const store = createFocusStore(memoryStorage(), 'a')
    store.getState().savePin(pin)
    expect(store.getState().movePin('local|missing', pin.identity)).toBe(false)
    expect(store.getState().movePin(pin.identity, 'local|missing')).toBe(false)
    expect(store.getState().movePin(pin.identity, pin.identity)).toBe(true)
    expect(store.getState().pins).toEqual([pin])
  })
  it('does not apply reorder or collapse changes if persistence fails', () => {
    const pins = [pin, { ...pin, identity: 'local|other' }]
    const store = createFocusStore(
      {
        getItem: () => JSON.stringify({ version: 1, mode: 'grid', pins }),
        setItem: () => {
          throw new Error('quota')
        }
      },
      'a'
    )
    expect(store.getState().movePin(pin.identity, 'local|other')).toBe(false)
    expect(store.getState().setProjectsCollapsed(true)).toBe(false)
    expect(store.getState()).toMatchObject({ pins, projectsCollapsed: false })
  })
})
