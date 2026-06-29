import { useEffect, useRef, useState } from 'react'
import { Gamepad2, Hand } from 'lucide-react'
import { Card } from './ui/Card'
import { StatusDot } from './ui/StatusDot'
import { cn } from '../lib/cn'
import { useControlSocket } from '../hooks/useControlSocket'
import { browserWsUrl } from '../lib/settings'

interface Props {
  target: string
  enabled: boolean
}

const STEP = 1.0 // clamped server-side; held = max speed

interface Vec { dx: number; dy: number; dz: number; drx: number; dry: number; drz: number }
const ZERO: Vec = { dx: 0, dy: 0, dz: 0, drx: 0, dry: 0, drz: 0 }

// keyboard → axis delta (translation WSAD/QE, rotation IK/JL/UO)
const KEYMAP: Record<string, [keyof Vec, number]> = {
  w: ['dx', STEP], s: ['dx', -STEP],
  a: ['dy', STEP], d: ['dy', -STEP],
  q: ['dz', STEP], e: ['dz', -STEP],
  i: ['drx', STEP], k: ['drx', -STEP],
  j: ['dry', STEP], l: ['dry', -STEP],
  u: ['drz', STEP], o: ['drz', -STEP],
}

export function TeleopPanel({ target, enabled }: Props) {
  const wsUrl = browserWsUrl(target, '/ws/control')
  const { send, status } = useControlSocket(wsUrl, enabled)

  const delta = useRef<Vec>({ ...ZERO })
  const gripper = useRef(-1) // -1 open, +1 close
  const [grip, setGrip] = useState(-1)
  const [active, setActive] = useState<string | null>(null)

  // stream the current command at 20 Hz while enabled (keeps server TTL fresh)
  useEffect(() => {
    if (status !== 'open') return
    const id = setInterval(() => {
      send({ type: 'cartesian_delta', ...delta.current, gripper: gripper.current })
    }, 50)
    return () => clearInterval(id)
  }, [status, send])

  // keyboard hold-to-move
  useEffect(() => {
    if (!enabled) return
    const set = (k: string, on: boolean) => {
      const m = KEYMAP[k.toLowerCase()]
      if (!m) return
      delta.current = { ...delta.current, [m[0]]: on ? m[1] : 0 }
    }
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key.toLowerCase() in KEYMAP) { set(e.key, true); setActive(e.key.toLowerCase()) }
      if (e.key === ' ') { gripper.current = gripper.current < 0 ? 1 : -1; setGrip(gripper.current) }
    }
    const up = (e: KeyboardEvent) => { set(e.key, false); setActive(null) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [enabled])

  const hold = (axis: keyof Vec, val: number, id: string) => ({
    onPointerDown: () => { delta.current = { ...delta.current, [axis]: val }; setActive(id) },
    onPointerUp: () => { delta.current = { ...delta.current, [axis]: 0 }; setActive(null) },
    onPointerLeave: () => { delta.current = { ...delta.current, [axis]: 0 } },
  })

  const Btn = ({ axis, val, id, label }: { axis: keyof Vec; val: number; id: string; label: string }) => (
    <button
      type="button"
      disabled={!enabled}
      {...hold(axis, val, id)}
      className={cn(
        'rounded-lg border border-border py-2 text-sm font-medium select-none',
        active === id ? 'bg-accent text-bg' : 'bg-panel-2 text-text hover:text-text-strong',
        'disabled:opacity-40',
      )}
    >
      {label}
    </button>
  )

  return (
    <Card
      title="遥操 Teleop"
      icon={Gamepad2}
      action={<StatusDot tone={status === 'open' ? 'ok' : 'idle'} label={status === 'open' ? 'ready' : status} pulse={status === 'open'} />}
    >
      <p className="mb-1 text-[11px] tracking-wide text-text/50 uppercase">平移 Translation</p>
      <div className="grid grid-cols-3 gap-2">
        <Btn axis="dx" val={STEP} id="x+" label="X+ (w)" />
        <Btn axis="dz" val={STEP} id="z+" label="Z+ (q)" />
        <Btn axis="dy" val={STEP} id="y+" label="Y+ (a)" />
        <Btn axis="dx" val={-STEP} id="x-" label="X− (s)" />
        <Btn axis="dz" val={-STEP} id="z-" label="Z− (e)" />
        <Btn axis="dy" val={-STEP} id="y-" label="Y− (d)" />
      </div>
      <p className="mt-3 mb-1 text-[11px] tracking-wide text-text/50 uppercase">旋转 Rotation</p>
      <div className="grid grid-cols-3 gap-2">
        <Btn axis="drx" val={STEP} id="rx+" label="Rx+ (i)" />
        <Btn axis="dry" val={STEP} id="ry+" label="Ry+ (j)" />
        <Btn axis="drz" val={STEP} id="rz+" label="Rz+ (u)" />
        <Btn axis="drx" val={-STEP} id="rx-" label="Rx− (k)" />
        <Btn axis="dry" val={-STEP} id="ry-" label="Ry− (l)" />
        <Btn axis="drz" val={-STEP} id="rz-" label="Rz− (o)" />
      </div>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => { gripper.current = gripper.current < 0 ? 1 : -1; setGrip(gripper.current) }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-panel-2 py-2 text-sm text-text hover:text-text-strong disabled:opacity-40"
      >
        <Hand className="size-4" /> 夹爪：{grip < 0 ? '开 (空格切换)' : '合 (空格切换)'}
      </button>
      <p className="mt-2 text-[11px] text-text/50">平移 W/S A/D Q/E，旋转 I/K J/L U/O，空格切夹爪；松开即停。</p>
    </Card>
  )
}
