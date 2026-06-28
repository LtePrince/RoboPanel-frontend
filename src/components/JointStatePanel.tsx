import { Bot } from 'lucide-react'
import { Card } from './ui/Card'
import { StatusDot } from './ui/StatusDot'
import { cn } from '../lib/cn'
import { fixed, rad2deg, RAD2DEG } from '../lib/format'
import type { JointState } from '../types'

interface Props {
  joints: JointState | undefined
  connected: boolean
}

/** Map a revolute joint angle (rad) to a 0..1 fill, clamped to ±180°. */
function angleFill(rad: number): number {
  const deg = rad * RAD2DEG
  return Math.min(1, Math.max(0, (deg + 180) / 360))
}

export function JointStatePanel({ joints, connected }: Props) {
  const positions = joints?.position ?? []
  const velocities = joints?.velocity ?? []
  const efforts = joints?.effort ?? []
  const n = positions.length

  return (
    <Card
      title="Arm — Joint State"
      icon={Bot}
      action={
        <StatusDot
          tone={connected ? 'ok' : 'idle'}
          label={connected ? 'connected' : 'no data'}
          pulse={connected}
        />
      }
    >
      {n === 0 ? (
        <p className="py-6 text-center text-sm text-text/60">No joint data received yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem] items-center gap-x-3 text-[11px] tracking-wide text-text/50 uppercase">
            <span>Joint</span>
            <span>Position</span>
            <span className="text-right">Vel</span>
            <span className="text-right">Effort</span>
          </div>
          {positions.map((pos, i) => (
            <div
              key={i}
              className="grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem] items-center gap-x-3"
            >
              <span className="text-xs font-medium text-text-strong">J{i + 1}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-100"
                    style={{ width: `${angleFill(pos) * 100}%` }}
                  />
                </div>
                <span className="tnum w-16 text-right text-sm text-text-strong">
                  {rad2deg(pos)}°
                </span>
              </div>
              <span className="tnum text-right text-xs text-text">{fixed(velocities[i], 2)}</span>
              <span
                className={cn(
                  'tnum text-right text-xs',
                  Math.abs(efforts[i] ?? 0) > 0.001 ? 'text-text-strong' : 'text-text/50',
                )}
              >
                {fixed(efforts[i], 2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
