/**
 * Two-layer config (mirrors BlogManager):
 *  1. Baseline defaults from build-time .env (VITE_*).
 *  2. Runtime override persisted to a local JSON file (robopanel.settings.json)
 *     via the Vite dev middleware at /__config — NOT browser storage.
 * Effective config = defaults merged with the stored override.
 */

export type Mode = 'real' | 'sim'

export interface Settings {
  /** Real robot backend, full prefix incl. /api/v1 (e.g. http://arm:8080/api/v1). */
  realApiUrl: string
  /** Sim backend (RoboPanel-Simbackend), full prefix incl. /api/v1. */
  simApiUrl: string
  /** Simulation video directory (local path; FastWAM eval results by default). */
  simVideoBase: string
}

/** Shape persisted to robopanel.settings.json (override layer). */
export interface StoredConfig {
  realApiUrl?: string
  simApiUrl?: string
  simVideoBase?: string
  mode?: Mode
}

const CONFIG_URL = '/__config'

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

/** Layer 1: committed baseline from .env. */
export function envDefaults(): Settings {
  return {
    realApiUrl: stripTrailingSlash(
      import.meta.env.VITE_REAL_API_URL ?? 'http://localhost:8080/api/v1',
    ),
    simApiUrl: stripTrailingSlash(
      import.meta.env.VITE_SIM_API_URL ?? 'http://localhost:9000/api/v1',
    ),
    simVideoBase: stripTrailingSlash(import.meta.env.VITE_SIM_VIDEO_BASE ?? ''),
  }
}

/** Read the override layer from the local JSON file (empty if none/unavailable). */
export async function fetchOverride(): Promise<StoredConfig> {
  try {
    const res = await fetch(CONFIG_URL)
    if (!res.ok) return {}
    return (await res.json()) as StoredConfig
  } catch {
    return {}
  }
}

/** Persist the override layer to the local JSON file. */
export async function persistOverride(cfg: StoredConfig): Promise<void> {
  await fetch(CONFIG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  })
}

/** Merge .env defaults with a stored override into effective settings. */
export function mergeSettings(stored: StoredConfig): Settings {
  const d = envDefaults()
  return {
    realApiUrl: stripTrailingSlash(stored.realApiUrl ?? d.realApiUrl),
    simApiUrl: stripTrailingSlash(stored.simApiUrl ?? d.simApiUrl),
    simVideoBase: stripTrailingSlash(stored.simVideoBase ?? d.simVideoBase),
  }
}

/**
 * With the dev proxy, the browser talks to the same-origin frontend at the
 * backend's *path* (e.g. /api/v1); the Vite server forwards to the arm. These
 * derive the relative REST prefix and the same-origin WS URL from realApiUrl.
 */
export function apiPathPrefix(realApiUrl: string): string {
  try {
    return stripTrailingSlash(new URL(realApiUrl).pathname) || '/api/v1'
  } catch {
    return '/api/v1'
  }
}

export function browserWsUrl(realApiUrl: string, path = '/ws/state'): string {
  const prefix = apiPathPrefix(realApiUrl)
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}${prefix}${path}`
}
