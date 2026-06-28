import { Wifi, WifiOff } from 'lucide-react'
import { StatusDot } from './ui/StatusDot'
import { cn } from '../lib/cn'
import type { WsStatus } from '../hooks/useRobotState'

interface Props {
  apiUrl: string
  wsStatus: WsStatus
  lastFrameAgo: number | null
  armConnected: boolean
  baseConnected: boolean
}

export function ConnectionStatus({
  apiUrl,
  wsStatus,
  lastFrameAgo,
  armConnected,
  baseConnected,
}: Props) {
  const live = wsStatus === 'open'
  // frames are pushed at 20 Hz; consider the stream stale if no frame for >1s
  const stale = lastFrameAgo !== null && lastFrameAgo > 1000

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-xl border border-border bg-panel px-4 py-2.5">
      <span className="tnum text-xs text-text/60">{apiUrl}</span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            live && !stale ? 'text-ok' : 'text-bad',
          )}
        >
          {live && !stale ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
          {wsStatus === 'open' && !stale && 'Live'}
          {wsStatus === 'open' && stale && 'Stalled'}
          {wsStatus === 'connecting' && 'Connecting…'}
          {wsStatus === 'closed' && 'Disconnected'}
        </span>
        <StatusDot tone={armConnected ? 'ok' : 'idle'} label="Arm" pulse={armConnected} />
        <StatusDot tone={baseConnected ? 'ok' : 'idle'} label="Base" pulse={baseConnected} />
      </div>
    </div>
  )
}
