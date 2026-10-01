// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import type { WorkspacePort, WorkspacePortScanResult } from '../../../../../shared/workspace-ports'
import { getFocusPortNumbers, getFocusPortScanKey } from './focus-ports'
const port = (number: number, worktreeId = 'workspace'): WorkspacePort => ({
  id: `tcp:${number}`,
  port: number,
  bindHost: '127.0.0.1',
  connectHost: '127.0.0.1',
  protocol: 'http',
  kind: 'workspace',
  owner: {
    worktreeId,
    repoId: 'repo',
    displayName: 'Workspace',
    path: '/tmp/demo',
    confidence: 'cwd'
  }
})
const scan = (ports: WorkspacePort[]): WorkspacePortScanResult => ({
  platform: 'darwin',
  scannedAt: Date.now(),
  ports
})
describe('Focus ports from the native host-specific scanner', () => {
  it('shows sorted unique attributed ports only', () => {
    expect(
      getFocusPortNumbers(
        scan([
          port(4000),
          port(3000),
          port(3000),
          port(9000, 'other'),
          {
            id: 'external',
            port: 8080,
            bindHost: 'localhost',
            connectHost: 'localhost',
            protocol: 'unknown',
            kind: 'external'
          },
          {
            id: 'container',
            port: 8081,
            bindHost: 'localhost',
            connectHost: 'localhost',
            protocol: 'unknown',
            kind: 'container'
          }
        ]),
        'workspace'
      )
    ).toEqual([3000, 4000])
  })
  it('hides missing, empty and unavailable scans', () => {
    expect(getFocusPortNumbers(undefined, 'workspace')).toEqual([])
    expect(getFocusPortNumbers(scan([]), 'workspace')).toEqual([])
    expect(
      getFocusPortNumbers({ ...scan([port(3000)]), unavailableReason: 'Disconnected' }, 'workspace')
    ).toEqual([])
  })
  it('does not share a port scan across identical workspace IDs on two hosts', () => {
    const scans = { 'local:all': scan([port(3000)]), 'environment:remote:all': scan([port(4000)]) }
    expect(
      getFocusPortNumbers(scans[getFocusPortScanKey('local')! as keyof typeof scans], 'workspace')
    ).toEqual([3000])
    expect(
      getFocusPortNumbers(
        scans[getFocusPortScanKey('runtime:remote')! as keyof typeof scans],
        'workspace'
      )
    ).toEqual([4000])
  })
  it('does not guess a local scan for a direct SSH target', () => {
    expect(getFocusPortScanKey('ssh:remote')).toBeNull()
  })
  it('ignores invalid numeric ports', () => {
    expect(
      getFocusPortNumbers(scan([port(0), port(-1), port(65536), port(1.5)]), 'workspace')
    ).toEqual([])
  })
})
