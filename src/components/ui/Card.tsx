import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface CardProps {
  title: string
  icon?: LucideIcon
  /** Optional element rendered on the right side of the header (badge, button). */
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, icon: Icon, action, className, children }: CardProps) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-border bg-panel shadow-sm',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-text-strong uppercase">
          {Icon && <Icon className="size-4 text-accent" />}
          {title}
        </h2>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  )
}
