import { NavLink } from 'react-router-dom'
import { Cpu, Bot, MonitorPlay } from 'lucide-react'
import { cn } from '../lib/cn'
import { useSettings } from '../context/SettingsContext'
import { routes } from '../routes'
import type { Mode } from '../lib/settings'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
    isActive ? 'bg-accent-soft text-accent' : 'text-text hover:bg-panel-2 hover:text-text-strong',
  )

const MODES: { value: Mode; label: string; icon: typeof Bot }[] = [
  { value: 'real', label: '真机', icon: Bot },
  { value: 'sim', label: '仿真', icon: MonitorPlay },
]

export function AppHeader() {
  const { mode, setMode, settings } = useSettings()
  const host = mode === 'real' ? settings.realApiUrl : settings.simVideoBase || '未配置'

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-2.5">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Cpu className="size-6 text-accent" />
            <span className="text-base font-semibold text-text-strong">RoboPanel</span>
          </div>
          <nav className="flex items-center gap-1">
            {routes.map((r) => {
              const Icon = r.icon
              return (
                <NavLink key={r.path} to={r.path} end={r.end} className={navClass}>
                  <Icon className="size-4" /> {r.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="tnum hidden text-xs text-text/50 sm:inline">{host}</span>
          <div className="flex rounded-lg border border-border bg-panel p-0.5">
            {MODES.map((m) => {
              const active = mode === m.value
              const Icon = m.icon
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition',
                    active ? 'bg-accent text-bg' : 'text-text hover:text-text-strong',
                  )}
                >
                  <Icon className="size-4" />
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
