import { cn } from '../../lib/cn'

export type Tone = 'ok' | 'warn' | 'bad' | 'idle'

const toneClasses: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  idle: 'bg-text/40',
}

interface StatusDotProps {
  tone: Tone
  label?: string
  pulse?: boolean
  className?: string
}

export function StatusDot({ tone, label, pulse, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span className="relative flex size-2.5">
        {pulse && tone !== 'idle' && (
          <span
            className={cn(
              'absolute inline-flex size-full animate-ping rounded-full opacity-60',
              toneClasses[tone],
            )}
          />
        )}
        <span className={cn('relative inline-flex size-2.5 rounded-full', toneClasses[tone])} />
      </span>
      {label && <span className="text-text">{label}</span>}
    </span>
  )
}
