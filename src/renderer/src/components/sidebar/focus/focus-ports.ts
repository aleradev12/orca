import { getWorkspacePortsByWorktreeId } from '@/lib/workspace-port-groups'
import { workspacePortScanKeyForTarget } from '@/lib/workspace-port-actions'
import { runtimeTargetForExecutionHostId } from '@/runtime/runtime-client-target'
import type { ExecutionHostId } from '../../../../../shared/execution-host'
import type { WorkspacePortScanResult } from '../../../../../shared/workspace-ports'

export function getFocusPortScanKey(hostId: ExecutionHostId): string | null {
  const target = runtimeTargetForExecutionHostId(hostId)
  return target ? workspacePortScanKeyForTarget(target) : null
}

export function getFocusPortNumbers(
  scan: WorkspacePortScanResult | undefined,
  worktreeId: string
): number[] {
  if (!scan || scan.unavailableReason) {
    return []
  }
  const ports = getWorkspacePortsByWorktreeId(scan).get(worktreeId) ?? []
  return [...new Set(ports.map((port) => port.port))]
    .filter((port) => Number.isInteger(port) && port > 0 && port <= 65535)
    .sort((a, b) => a - b)
}
