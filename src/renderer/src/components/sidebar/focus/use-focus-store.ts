import { useStore } from 'zustand'
import { useAppStore } from '@/store'
import { createFocusStore, type FocusState } from './focus-state'

const stores = new Map<string, ReturnType<typeof createFocusStore>>()
const storage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value)
}

export function useFocusStore<T>(selector: (state: FocusState) => T): T {
  const profileId = useAppStore((state) => state.activeOrcaProfileId)
  const key = `orca-focus-v1:${profileId ?? 'loading'}`
  let store = stores.get(key)
  if (!store) {
    store = createFocusStore(storage, key)
    stores.set(key, store)
  }
  return useStore(store, selector)
}
