import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  envDefaults,
  fetchOverride,
  persistOverride,
  mergeSettings,
  type Settings,
  type Mode,
} from '../lib/settings'

interface SettingsContextValue {
  settings: Settings
  mode: Mode
  /** True until the override file has been loaded once. */
  loaded: boolean
  /** Active backend prefix for the current mode (real → realApiUrl). */
  activeApiUrl: string
  setMode: (m: Mode) => void
  updateSettings: (next: Settings) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  // start from .env defaults, then hydrate from the JSON file on mount
  const [settings, setSettings] = useState<Settings>(() => envDefaults())
  const [mode, setModeState] = useState<Mode>('sim') // default to sim (prioritise showing it)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    fetchOverride().then((stored) => {
      if (!alive) return
      setSettings(mergeSettings(stored))
      if (stored.mode) setModeState(stored.mode)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  // persist the full override (settings + mode) to the JSON file
  const persist = useCallback((next: Settings, nextMode: Mode) => {
    void persistOverride({ ...next, mode: nextMode })
  }, [])

  const setMode = useCallback(
    (m: Mode) => {
      setModeState(m)
      persist(settings, m)
    },
    [settings, persist],
  )

  const updateSettings = useCallback(
    (next: Settings) => {
      setSettings(next)
      persist(next, mode)
    },
    [mode, persist],
  )

  const resetSettings = useCallback(() => {
    const d = envDefaults()
    setSettings(d)
    setModeState('sim')
    void persistOverride({}) // empty override → back to .env defaults
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      mode,
      loaded,
      activeApiUrl: mode === 'sim' ? settings.simApiUrl : settings.realApiUrl,
      setMode,
      updateSettings,
      resetSettings,
    }),
    [settings, mode, loaded, setMode, updateSettings, resetSettings],
  )

  return <SettingsContext value={value}>{children}</SettingsContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
