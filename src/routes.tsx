import type { ReactElement } from 'react'
import { Activity, Settings as SettingsIcon, type LucideIcon } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { SettingsPage } from './pages/SettingsPage'

export interface AppRoute {
  path: string
  label: string
  icon: LucideIcon
  element: ReactElement
  /** Exact match for NavLink active state (used for the index route). */
  end?: boolean
}

/** Single source of truth for routes + header nav. Add a page here. */
export const routes: AppRoute[] = [
  { path: '/', label: '监控', icon: Activity, element: <Dashboard />, end: true },
  { path: '/settings', label: '设置', icon: SettingsIcon, element: <SettingsPage /> },
]
