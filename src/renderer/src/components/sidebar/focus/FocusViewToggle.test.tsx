// @vitest-environment happy-dom
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FocusViewToggle } from './FocusViewToggle'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('Focus view switch', () => {
  it('uses one button and switches both ways with a next-action accessible name', async () => {
    const element = document.createElement('div')
    document.body.append(element)
    const root = createRoot(element)
    function Controller() {
      const [mode, setMode] = useState<'grid' | 'list'>('grid')
      return (
        <TooltipProvider>
          <FocusViewToggle mode={mode} onChange={setMode} />
        </TooltipProvider>
      )
    }
    try {
      await act(async () => root.render(<Controller />))
      expect(element.querySelectorAll('button')).toHaveLength(1)
      const button = element.querySelector('button')!
      expect(button.getAttribute('aria-label')).toBe('Switch to list view')
      await act(async () => button.click())
      expect(button.getAttribute('data-current-view')).toBe('list')
      expect(button.getAttribute('aria-label')).toBe('Switch to grid view')
      await act(async () => button.click())
      expect(button.getAttribute('data-current-view')).toBe('grid')
    } finally {
      await act(async () => root.unmount())
      element.remove()
    }
  })
  it('does not switch while the profile is unavailable', async () => {
    const element = document.createElement('div')
    const root = createRoot(element),
      onChange = vi.fn()
    try {
      await act(async () =>
        root.render(
          <TooltipProvider>
            <FocusViewToggle mode="grid" disabled onChange={onChange} />
          </TooltipProvider>
        )
      )
      await act(async () => element.querySelector('button')!.click())
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      await act(async () => root.unmount())
    }
  })
})
