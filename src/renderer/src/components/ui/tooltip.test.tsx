// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('tooltip surface variant', () => {
  for (const variant of ['label', 'surface'] as const) {
    it(`keeps content and arrow on the same ${variant} tokens`, async () => {
      const element = document.createElement('div')
      document.body.append(element)
      const root = createRoot(element)
      try {
        await act(async () => {
          root.render(
            <TooltipProvider>
              <Tooltip open>
                <TooltipTrigger asChild>
                  <button>Context</button>
                </TooltipTrigger>
                <TooltipContent variant={variant}>Workspace context</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })
        const content = document.querySelector('[data-slot="tooltip-content"]')
        const arrow = content?.querySelector('svg')
        const background = variant === 'surface' ? 'popover' : 'foreground'
        expect(content?.className.split(' ')).toContain(`bg-${background}`)
        expect(arrow?.getAttribute('class')?.split(' ')).toContain(`fill-${background}`)
        expect(content?.className.split(' ')).toContain(
          variant === 'surface' ? 'text-popover-foreground' : 'text-background'
        )
        if (variant === 'surface') {
          expect(content?.className.split(' ')).not.toContain('bg-foreground')
          expect(content?.className.split(' ')).not.toContain('text-background')
        }
      } finally {
        await act(async () => root.unmount())
        element.remove()
      }
    })
  }
})
