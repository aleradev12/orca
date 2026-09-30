// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Worktree } from '../../../../../shared/worktree/types'
import { FocusReadMenuItem } from './FocusReadMenuItem'

const { updateWorktreeMeta } = vi.hoisted(() => ({
  updateWorktreeMeta: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) => selector({ updateWorktreeMeta })
}))
vi.mock('@/i18n/i18n', () => ({ translate: (_key: string, fallback: string) => fallback }))
vi.mock('@/components/ui/context-menu', () => ({
  ContextMenuItem: ({
    onSelect,
    disabled,
    children
  }: {
    onSelect: () => void
    disabled: boolean
    children: React.ReactNode
  }) => (
    <button disabled={disabled} onClick={onSelect}>
      {children}
    </button>
  )
}))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const workspace = { id: 'same-id-on-two-hosts', isArchived: false, isUnread: false } as Worktree

describe('Focus read menu action', () => {
  beforeEach(() => vi.clearAllMocks())
  for (const test of [
    { workspace, label: 'Mark Unread', unread: true, disabled: false },
    {
      workspace: { ...workspace, isUnread: true },
      label: 'Mark Read',
      unread: false,
      disabled: false
    },
    { workspace: { ...workspace, isArchived: true }, label: 'Mark Unread', disabled: true },
    { workspace: undefined, label: 'Mark Unread', disabled: true }
  ]) {
    it(`${test.label}: ${test.disabled ? 'unavailable' : 'available'} target`, async () => {
      const element = document.createElement('div')
      document.body.append(element)
      const root = createRoot(element)
      try {
        await act(async () =>
          root.render(
            <FocusReadMenuItem workspace={test.workspace} executionHostId="ssh:remote-target" />
          )
        )
        const button = element.querySelector('button')!
        expect(button.textContent).toBe(test.label)
        expect(button.disabled).toBe(test.disabled)
        await act(async () => button.click())
        if (test.disabled) {
          expect(updateWorktreeMeta).not.toHaveBeenCalled()
        } else {
          expect(updateWorktreeMeta).toHaveBeenCalledExactlyOnceWith(
            workspace.id,
            { isUnread: test.unread },
            { executionHostId: 'ssh:remote-target' }
          )
        }
      } finally {
        await act(async () => root.unmount())
        element.remove()
      }
    })
  }
})
