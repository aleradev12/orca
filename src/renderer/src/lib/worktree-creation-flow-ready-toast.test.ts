import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  PendingWorktreeCreation,
  WorktreeCreationRequest
} from '@/lib/pending-worktree-creation'
import type { CreateWorktreeResult } from '../../../shared/worktree/create-types'

type ReadyToastCall = { message: string; label: string; onClick: () => void }

const { readyToast } = vi.hoisted(() => {
  const calls: ReadyToastCall[] = []
  return { readyToast: { calls } }
})

type NavigationState = {
  activeView: 'terminal' | 'tasks'
  activePendingCreationId: string | null
  pendingWorktreeCreations: Record<string, PendingWorktreeCreation>
}
const navigation: NavigationState = {
  activeView: 'terminal',
  activePendingCreationId: 'creation-1',
  pendingWorktreeCreations: {}
}

const store = Object.assign(navigation, {
  settings: {},
  repos: [],
  beginPendingWorktreeCreation: vi.fn(),
  updatePendingWorktreeCreation: vi.fn(
    (creationId: string, patch: Partial<PendingWorktreeCreation>) => {
      const entry = store.pendingWorktreeCreations[creationId]
      if (entry) {
        store.pendingWorktreeCreations[creationId] = { ...entry, ...patch }
      }
    }
  ),
  removePendingWorktreeCreation: vi.fn((creationId: string) => {
    delete store.pendingWorktreeCreations[creationId]
  }),
  updateWorktreeMeta: vi.fn(),
  setActivePendingWorktreeCreation: vi.fn(),
  setActiveView: vi.fn(),
  setSidebarOpen: vi.fn(),
  createWorktree: vi.fn<() => Promise<CreateWorktreeResult>>(),
  seedNativeChatLaunchDraft: vi.fn(),
  setTabViewMode: vi.fn(),
  tabsByWorktree: {},
  unifiedTabsByWorktree: {}
})

vi.mock('@/store', () => ({
  useAppStore: {
    getState: () => store
  }
}))

vi.mock('@/lib/worktree-activation', () => ({
  activateAndRevealWorktree: vi.fn(() => false)
}))

vi.mock('@/lib/worktree-initial-terminal-seeding', () => ({
  ensureWorktreeHasInitialTerminal: vi.fn(() => 'tab-1')
}))

vi.mock('@/lib/workspace-activation-terminal-focus', () => ({
  queueWorkspaceActivationTerminalFocus: vi.fn()
}))

vi.mock('@/lib/new-workspace', () => ({
  ensureAgentStartupInTerminal: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(
      (message: string, options: { action: { label: string; onClick: () => void } }) => {
        readyToast.calls.push({ message, ...options.action })
      }
    )
  }
}))

vi.mock('@/lib/ephemeral-vm-workspace-target', () => ({
  prepareEphemeralVmWorkspaceTarget: vi.fn()
}))

import { activateAndRevealWorktree } from '@/lib/worktree-activation'
import { makeWorktree } from '@/store/slices/worktrees-slice-test-fixtures'
import { queueWorkspaceActivationTerminalFocus } from '@/lib/workspace-activation-terminal-focus'
import { continueBackgroundWorktreeCreation } from './worktree-creation-flow'

function makeRequest(): WorktreeCreationRequest {
  return {
    repoId: 'repo-1',
    name: 'feature',
    setupDecision: 'inherit',
    agent: null,
    pendingFirstAgentMessageRename: false,
    note: '',
    startupPlan: null,
    quickPrompt: '',
    quickTelemetry: null
  }
}

function makeCreateResult(): CreateWorktreeResult {
  return { worktree: makeWorktree({ id: 'wt-1', repoId: 'repo-1', displayName: 'Feature' }) }
}

// Resolves createWorktree only when the test says so, so it can move the user first.
function deferCreate(): () => void {
  let resolve!: (result: CreateWorktreeResult) => void
  store.createWorktree.mockReturnValueOnce(new Promise((r) => (resolve = r)))
  return () => resolve(makeCreateResult())
}

async function startCreate(): Promise<() => void> {
  const finish = deferCreate()
  continueBackgroundWorktreeCreation('creation-1', makeRequest(), { revealCreationSurface: false })
  await vi.waitFor(() => expect(store.createWorktree).toHaveBeenCalledTimes(1))
  return finish
}

beforeEach(() => {
  vi.clearAllMocks()
  readyToast.calls.length = 0
  store.activeView = 'terminal'
  store.activePendingCreationId = 'creation-1'
  store.pendingWorktreeCreations = {
    'creation-1': {
      creationId: 'creation-1',
      phase: 'preparing',
      status: 'creating',
      startedAt: 1,
      indeterminate: false,
      loaderVisible: true,
      request: makeRequest()
    }
  }
})

describe('a creation that finishes after the user moved on (#9944)', () => {
  it('keeps the user on the workspace they switched to and offers the new one in a toast', async () => {
    const finish = await startCreate()
    // Selecting a real workspace clears only the pending surface pointer.
    store.activePendingCreationId = null
    finish()
    await vi.waitFor(() => expect(store.removePendingWorktreeCreation).toHaveBeenCalled())

    expect(activateAndRevealWorktree).not.toHaveBeenCalled()
    expect(queueWorkspaceActivationTerminalFocus).not.toHaveBeenCalled()
    expect(readyToast.calls).toHaveLength(1)
    expect(readyToast.calls[0]).toMatchObject({ message: 'Feature is ready', label: 'Open' })

    readyToast.calls[0]?.onClick()
    expect(activateAndRevealWorktree).toHaveBeenCalledWith('wt-1', {
      sidebarRevealBehavior: 'auto'
    })
  })

  it('toasts when the user left for another app view', async () => {
    const finish = await startCreate()
    store.activeView = 'tasks'
    finish()
    await vi.waitFor(() => expect(store.removePendingWorktreeCreation).toHaveBeenCalled())

    expect(activateAndRevealWorktree).not.toHaveBeenCalled()
    expect(readyToast.calls).toHaveLength(1)
  })

  it('hands the workspace over without a toast when the user is still watching', async () => {
    const finish = await startCreate()
    finish()
    await vi.waitFor(() => expect(store.removePendingWorktreeCreation).toHaveBeenCalled())

    expect(activateAndRevealWorktree).toHaveBeenCalledTimes(1)
    expect(readyToast.calls).toHaveLength(0)
  })

  it('does not toast a creation cancelled before it finished', async () => {
    const finish = await startCreate()
    store.removePendingWorktreeCreation('creation-1')
    store.activePendingCreationId = null
    finish()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(readyToast.calls).toHaveLength(0)
  })
})
