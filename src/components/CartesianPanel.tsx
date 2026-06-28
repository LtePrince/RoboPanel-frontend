import { Move3d } from 'lucide-react'
import { Card } from './ui/Card'
import { Stat } from './ui/Stat'
import { fixed } from '../lib/format'
import type { CartesianState } from '../types'

interface Props {
  pose: CartesianState | undefined
}

export function CartesianPanel({ pose }: Props) {
  return (
    <Card title="Tool Pose (Cartesian)" icon={Move3d}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-[11px] tracking-wide text-text/50 uppercase">Position</p>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="X" value={fixed(pose?.x)} unit="m" />
            <Stat label="Y" value={fixed(pose?.y)} unit="m" />
            <Stat label="Z" value={fixed(pose?.z)} unit="m" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] tracking-wide text-text/50 uppercase">
            Orientation (quaternion)
          </p>
          <div className="grid grid-cols-4 gap-3">
            <Stat label="qx" value={fixed(pose?.qx)} />
            <Stat label="qy" value={fixed(pose?.qy)} />
            <Stat label="qz" value={fixed(pose?.qz)} />
            <Stat label="qw" value={fixed(pose?.qw)} />
          </div>
        </div>
      </div>
    </Card>
  )
}
