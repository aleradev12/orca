// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { FocusUnreadIndicator } from './FocusUnreadIndicator'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('Focus unread indicator', () => {
  it('appears only for Projects unread flag and disappears when read', async () => {
    const element = document.createElement('div')
    document.body.append(element)
    const root = createRoot(element)
    try {
      await act(async () => root.render(<FocusUnreadIndicator isUnread={false} />))
      expect(element.querySelector('[data-focus-unread]')).toBeNull()
      await act(async () => root.render(<FocusUnreadIndicator isUnread />))
      const indicator = element.querySelector('[data-focus-unread]')
      expect(indicator?.getAttribute('aria-label')).toBe('Unread')
      expect(indicator?.className).toContain('size-2.5')
      expect(indicator?.className).toContain('bg-amber-500')
      await act(async () => root.render(<FocusUnreadIndicator isUnread={false} />))
      expect(element.querySelector('[data-focus-unread]')).toBeNull()
    } finally {
      await act(async () => root.unmount())
      element.remove()
    }
  })
})
