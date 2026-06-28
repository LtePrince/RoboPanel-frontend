import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface StatProps {
  label: string
  value: ReactNode
  unit?: string
  className?: string
}

/** A labelled telemetry value (label on top, monospace value below). */
export function Stat({ label, value, unit, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-[11px] tracking-wide text-text/70 uppercase">{label}</span>
      <span className="tnum text-lg leading-none text-text-strong">
        {value}
        {unit && <span className="ml-1 text-xs text-text/60">{unit}</span>}
      </span>
    </div>
  )
}
