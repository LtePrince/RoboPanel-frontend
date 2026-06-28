import { Navigation } from 'lucide-react'
import { Card } from './ui/Card'
import { Stat } from './ui/Stat'
import { StatusDot } from './ui/StatusDot'
import { fixed, rad2deg } from '../lib/format'
import type { BaseState } from '../types'

interface Props {
  base: BaseState | undefined
  connected: boolean
}

export function BasePanel({ base, connected }: Props) {
  return (
    <Card
      title="Mobile Base — Odometry"
      icon={Navigation}
      action={
        <StatusDot
          tone={connected ? 'ok' : 'idle'}
          label={connected ? 'connected' : 'no data'}
          pulse={connected}
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Pos X" value={fixed(base?.pos_x)} unit="m" />
        <Stat label="Pos Y" value={fixed(base?.pos_y)} unit="m" />
        <Stat label="Yaw" value={base ? rad2deg(base.yaw) : '—'} unit="°" />
        <Stat label="Vel X" value={fixed(base?.vel_x, 2)} unit="m/s" />
        <Stat label="Vel θ" value={fixed(base?.vel_theta, 2)} unit="rad/s" />
      </div>
    </Card>
  )
}
