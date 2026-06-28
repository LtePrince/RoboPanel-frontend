import { BatteryMedium, Map as MapIcon } from 'lucide-react'
import { Card } from './ui/Card'
import { Stat } from './ui/Stat'
import { cn } from '../lib/cn'
import { fixed } from '../lib/format'
import type { NavState } from '../types'

interface Props {
  nav: NavState | undefined
}

function batteryTone(power: number): string {
  if (power <= 20) return 'bg-bad'
  if (power <= 50) return 'bg-warn'
  return 'bg-ok'
}

export function NavPanel({ nav }: Props) {
  const power = nav?.power ?? 0
  const busy = (nav?.busy_status ?? 0) !== 0

  return (
    <Card
      title="Navigation Status"
      icon={MapIcon}
      action={
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium',
            busy ? 'bg-warn/15 text-warn' : 'bg-ok/15 text-ok',
          )}
        >
          {busy ? 'busy' : 'idle'}
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] tracking-wide text-text/60 uppercase">
              <BatteryMedium className="size-3.5" /> Battery
            </span>
            <span className="tnum text-sm text-text-strong">{fixed(power, 0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-panel-2">
            <div
              className={cn('h-full rounded-full transition-[width]', batteryTone(power))}
              style={{ width: `${Math.min(100, Math.max(0, power))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Nav status" value={nav?.nav_status ?? '—'} />
          <Stat label="Map status" value={nav?.map_status ?? '—'} />
          <Stat label="Busy" value={nav?.busy_status ?? '—'} />
        </div>

        <div>
          <p className="mb-2 text-[11px] tracking-wide text-text/50 uppercase">Current pose</p>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="X" value={fixed(nav?.current_pos_x)} unit="m" />
            <Stat label="Y" value={fixed(nav?.current_pos_y)} unit="m" />
            <Stat label="Angle" value={fixed(nav?.current_angle, 2)} unit="rad" />
          </div>
        </div>
      </div>
    </Card>
  )
}
