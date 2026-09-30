import { createStore } from 'zustand/vanilla'
import { z } from 'zod'
import {
  isWorktreeHostIdentity,
  getExecutionHostIdFromWorktreeHostIdentity
} from '../../../../../shared/worktree/host-qualified-identity'

export const focusPinSchema = z.object({
  identity: z
    .string()
    .refine(
      (value) =>
        isWorktreeHostIdentity(value) && Boolean(getExecutionHostIdFromWorktreeHostIdentity(value))
    ),
  emoji: z.string().min(1).max(16),
  label: z.string().max(120),
  name: z.string().min(1),
  path: z.string()
})
const documentSchema = z.object({
  version: z.literal(1),
  mode: z.enum(['grid', 'list']),
  pins: z.array(focusPinSchema),
  projectsCollapsed: z.boolean().default(false)
})
export type FocusPin = z.infer<typeof focusPinSchema>
export type FocusDocument = z.infer<typeof documentSchema>
export type FocusState = FocusDocument & {
  error: string | null
  savePin: (pin: FocusPin) => boolean
  removePin: (identity: string) => boolean
  setMode: (mode: FocusDocument['mode']) => boolean
  movePin: (identity: string, overIdentity: string) => boolean
  setProjectsCollapsed: (collapsed: boolean) => boolean
}
export const emptyFocusDocument: FocusDocument = {
  version: 1,
  mode: 'grid',
  pins: [],
  projectsCollapsed: false
}

export function decodeFocusDocument(raw: string | null): FocusDocument {
  if (!raw) {
    return emptyFocusDocument
  }
  const data = documentSchema.parse(JSON.parse(raw))
  return { ...data, pins: [...new Map(data.pins.map((pin) => [pin.identity, pin])).values()] }
}

export function createFocusStore(storage: Pick<Storage, 'getItem' | 'setItem'>, key: string) {
  let initial = emptyFocusDocument
  let error: string | null = null
  try {
    initial = decodeFocusDocument(storage.getItem(key))
  } catch {
    error = 'Could not load Focus. Saved data has not been changed.'
  }
  return createStore<FocusState>((set, get) => {
    function write(changes: Partial<FocusDocument>): boolean {
      const { version, mode, pins, projectsCollapsed } = get()
      const next: FocusDocument = { version, mode, pins, projectsCollapsed, ...changes }
      try {
        storage.setItem(key, JSON.stringify(next))
        set({ ...next, error: null })
        return true
      } catch {
        set({ error: 'Could not save Focus. Your changes have not been saved.' })
        return false
      }
    }
    return {
      ...initial,
      error,
      savePin(pin) {
        const checked = focusPinSchema.safeParse(pin)
        if (!checked.success) {
          set({ error: 'Choose an emoji and a workspace before saving.' })
          return false
        }
        const current = get()
        const exists = current.pins.some((item) => item.identity === pin.identity)
        return write({
          pins: exists
            ? current.pins.map((item) => (item.identity === pin.identity ? checked.data : item))
            : [...current.pins, checked.data]
        })
      },
      removePin(identity) {
        const current = get()
        return write({
          pins: current.pins.filter((pin) => pin.identity !== identity)
        })
      },
      setMode(mode) {
        return write({ mode })
      },
      movePin(identity, overIdentity) {
        const pins = [...get().pins]
        const from = pins.findIndex((pin) => pin.identity === identity)
        const to = pins.findIndex((pin) => pin.identity === overIdentity)
        if (from === -1 || to === -1) {
          return false
        }
        if (from === to) {
          return true
        }
        const [moved] = pins.splice(from, 1)
        pins.splice(to, 0, moved)
        return write({ pins })
      },
      setProjectsCollapsed(projectsCollapsed) {
        return write({ projectsCollapsed })
      }
    }
  })
}
