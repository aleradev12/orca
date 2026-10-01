import { useMemo } from 'react'
import { Plug } from 'lucide-react'
import { useAppStore } from '@/store'
import type { ExecutionHostId } from '../../../../../shared/execution-host'
import { getFocusPortNumbers, getFocusPortScanKey } from './focus-ports'

export function FocusPortsIndicator({
  worktreeId,
  executionHostId,
  details = false
}: {
  worktreeId: string
  executionHostId: ExecutionHostId
  details?: boolean
}) {
  const key = getFocusPortScanKey(executionHostId)
  const scan = useAppStore((state) => (key ? state.workspacePortScansByKey[key] : undefined))
  const ports = useMemo(() => getFocusPortNumbers(scan, worktreeId), [scan, worktreeId])
  if (!ports.length) {
    return null
  }
  const label = `Listening ports: ${ports.join(', ')}`
  return (
    <span
      data-focus-ports
      role="img"
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1 text-muted-foreground"
    >
      <Plug aria-hidden="true" className="size-3" />
      {details && <span>{label}</span>}
    </span>
  )
}
