/**
 * Two-layer config (mirrors BlogManager):
 *  1. Baseline defaults from build-time .env (VITE_*).
 *  2. Runtime overrides from browser localStorage, edited in the Settings page.
 * Effective settings = defaults merged with the stored override.
 */

export type Mode = 'real' | 'sim'

export interface Settings {
  /** Real robot backend, full prefix incl. /api/v1 (e.g. http://arm:8080/api/v1). */
  realApiUrl: string
  /** Simulation video source base URL (connection TBD; may be empty). */
  simVideoBase: string
}

const STORAGE_KEY = 'robopanel-settings'
const MODE_KEY = 'robopanel-mode'

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

/** Layer 1: committed baseline from .env. */
export function envDefaults(): Settings {
  return {
    realApiUrl: stripTrailingSlash(
      import.meta.env.VITE_REAL_API_URL ?? 'http://localhost:8080/api/v1',
    ),
    simVideoBase: stripTrailingSlash(import.meta.env.VITE_SIM_VIDEO_BASE ?? ''),
  }
}

/** Effective settings: defaults overlaid with the localStorage override. */
export function loadSettings(): Settings {
  const defaults = envDefaults()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const stored = JSON.parse(raw) as Partial<Settings>
    return {
      realApiUrl: stripTrailingSlash(stored.realApiUrl ?? defaults.realApiUrl),
      simVideoBase: stripTrailingSlash(stored.simVideoBase ?? defaults.simVideoBase),
    }
  } catch {
    return defaults
  }
}

/** Persist the runtime override layer. */
export function saveSettings(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

/** Clear the override layer, reverting to .env defaults. */
export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function loadMode(): Mode {
  return localStorage.getItem(MODE_KEY) === 'sim' ? 'sim' : 'real'
}

export function saveMode(m: Mode): void {
  localStorage.setItem(MODE_KEY, m)
}

/** Derive the WebSocket state URL from a /api/v1 HTTP prefix. */
export function wsStateUrl(apiPrefix: string): string {
  return `${stripTrailingSlash(apiPrefix)}/ws/state`.replace(/^http/, 'ws')
}
