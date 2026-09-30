import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { SortableFocusPin } from './SortableFocusPin'
import { FocusViewToggle } from './FocusViewToggle'
import { useAppStore } from '@/store'
import { useAllWorktrees } from '@/store/selectors'
import { cn } from '@/lib/utils'
import { folderWorkspaceToWorktree } from '../../../../../shared/folder-workspace-worktree'
import { getRepoExecutionHostId } from '../../../../../shared/execution-host'
import { composeWorktreeHostIdentity } from '../../../../../shared/worktree/host-qualified-identity'
import { useFocusStore } from './use-focus-store'

export function FocusPanel() {
  const profileId = useAppStore((state) => state.activeOrcaProfileId)
  const worktrees = useAllWorktrees()
  const folders = useAppStore((state) => state.folderWorkspaces)
  const repos = useAppStore((state) => state.repos)
  const activeId = useAppStore((state) => state.activeWorktreeId)
  const activeHost = useAppStore((state) => state.activeWorkspaceExecutionHostId)
  const pins = useFocusStore((state) => state.pins)
  const mode = useFocusStore((state) => state.mode)
  const error = useFocusStore((state) => state.error)
  const setMode = useFocusStore((state) => state.setMode)
  const movePin = useFocusStore((state) => state.movePin)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter still opens a workspace; Space starts keyboard reordering.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] }
    })
  )
  const catalog = useMemo(() => {
    const repoHosts = new Map(repos.map((repo) => [repo.id, getRepoExecutionHostId(repo)]))
    return new Map(
      [...worktrees, ...folders.map(folderWorkspaceToWorktree)].map((worktree) => [
        composeWorktreeHostIdentity(
          worktree.hostId ?? repoHosts.get(worktree.repoId) ?? 'local',
          worktree.id
        ),
        worktree
      ])
    )
  }, [worktrees, folders, repos])
  const activeIdentity = activeId
    ? composeWorktreeHostIdentity(activeHost ?? 'local', activeId)
    : null
  return (
    <section aria-label="Focus" data-focus-panel className="flex min-h-0 shrink-0 flex-col">
      <div className="mt-2 flex h-8 min-w-0 items-center justify-between gap-1.5 px-2">
        <span
          className="min-w-0 truncate select-none pl-2 pr-0.5 text-xs font-semibold text-muted-foreground/80"
          data-sidebar-section-title="focus"
        >
          Focus
        </span>
        <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Focus display">
          <FocusViewToggle mode={mode} disabled={!profileId} onChange={setMode} />
        </div>
      </div>
      {error && (
        <p role="alert" className="px-4 py-1 text-xs text-destructive">
          {error}
        </p>
      )}
      {profileId && pins.length === 0 && (
        <p className="px-4 py-2 text-xs text-muted-foreground">Right-click a workspace → Focus</p>
      )}
      {profileId && pins.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                'Press Space to reorder a Focus item, arrow keys to move, Space or Enter to drop, and Escape to cancel. Enter opens the workspace when not dragging.'
            }
          }}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) {
              movePin(String(active.id), String(over.id))
            }
          }}
        >
          <SortableContext
            items={pins.map((pin) => pin.identity)}
            strategy={mode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
          >
            <div
              data-focus-mode={mode}
              className={cn(
                'max-h-[35vh] overflow-y-auto scrollbar-sleek px-3 pb-1',
                mode === 'grid' ? 'grid grid-cols-5 gap-1.5' : 'flex flex-col gap-0.5'
              )}
            >
              {pins.map((pin) => (
                <SortableFocusPin
                  key={pin.identity}
                  pin={pin}
                  workspace={catalog.get(pin.identity)}
                  mode={mode}
                  current={activeIdentity === pin.identity}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}
