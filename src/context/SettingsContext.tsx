import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  loadSettings,
  saveSettings,
  clearSettings,
  loadMode,
  saveMode,
  type Settings,
  type Mode,
} from '../lib/settings'

interface SettingsContextValue {
  settings: Settings
  mode: Mode
  /** Active backend prefix for the current mode (real → realApiUrl). */
  activeApiUrl: string
  setMode: (m: Mode) => void
  updateSettings: (next: Settings) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [mode, setModeState] = useState<Mode>(() => loadMode())

  const setMode = useCallback((m: Mode) => {
    saveMode(m)
    setModeState(m)
  }, [])

  const updateSettings = useCallback((next: Settings) => {
    saveSettings(next)
    setSettings(next)
  }, [])

  const resetSettings = useCallback(() => {
    clearSettings()
    setSettings(loadSettings())
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      mode,
      activeApiUrl: settings.realApiUrl,
      setMode,
      updateSettings,
      resetSettings,
    }),
    [settings, mode, setMode, updateSettings, resetSettings],
  )

  return <SettingsContext value={value}>{children}</SettingsContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
