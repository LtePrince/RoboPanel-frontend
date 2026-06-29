import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { promises as fsp, readFileSync, statSync, readdirSync, createReadStream } from 'node:fs'
import path from 'node:path'
import { createProxyServer } from 'http-proxy-3'

const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i
const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}

const CONFIG_FILE = 'robopanel.settings.json'
const CONFIG_ROUTE = '/__config'

function configPath() {
  return path.resolve(process.cwd(), CONFIG_FILE)
}

/**
 * Dev-server middlewares (same Vite Node process):
 *  1. /__config  — read/write the runtime override to a local JSON file
 *                  (SPA analog of BlogManager's manager-settings.json).
 *  2. /api, /ws  — dynamic reverse proxy to the arm backend. The target is read
 *                  from the config file on each request, so changing the backend
 *                  in Settings takes effect WITHOUT restarting the dev server.
 *                  The browser only ever talks to this same-origin server.
 * Both are dev-only (no Node server in a static prod build).
 */
function serverLayerPlugin(
  envDefaultTarget: string,
  envDefaultSimApi: string,
  envDefaultSimDir: string,
): Plugin {
  /**
   * Current proxy target origin, chosen by mode: real → realApiUrl (arm),
   * sim → simApiUrl (local sim backend). Read from config per request, so
   * toggling 真机/仿真 in the UI retargets the proxy with no restart.
   */
  function target(): string | null {
    let url = envDefaultTarget
    try {
      const cfg = JSON.parse(readFileSync(configPath(), 'utf8')) as {
        realApiUrl?: string
        simApiUrl?: string
        mode?: string
      }
      if (cfg.mode === 'sim') url = cfg.simApiUrl || envDefaultSimApi
      else url = cfg.realApiUrl || envDefaultTarget
    } catch {
      /* no override file → use .env default (real) */
    }
    try {
      return new URL(url).origin
    } catch {
      return null
    }
  }

  /** Current sim video directory (absolute), from config or .env default. */
  function simDir(): string | null {
    let dir = envDefaultSimDir
    try {
      const cfg = JSON.parse(readFileSync(configPath(), 'utf8')) as { simVideoBase?: string }
      if (cfg.simVideoBase) dir = cfg.simVideoBase
    } catch {
      /* no override file → use .env default */
    }
    return dir ? path.resolve(dir) : null
  }

  return {
    name: 'robopanel-server-layer',
    configureServer(server) {
      // --- 1. config file read/write ---
      server.middlewares.use(CONFIG_ROUTE, async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          if (req.method === 'GET') {
            let data = '{}'
            try {
              data = await fsp.readFile(configPath(), 'utf8')
            } catch {
              /* no file yet */
            }
            res.end(data || '{}')
            return
          }
          if (req.method === 'POST') {
            const chunks: Buffer[] = []
            for await (const c of req) chunks.push(c as Buffer)
            const body = Buffer.concat(chunks).toString('utf8') || '{}'
            const parsed = JSON.parse(body)
            await fsp.writeFile(configPath(), JSON.stringify(parsed, null, 2), 'utf8')
            res.end(JSON.stringify(parsed))
            return
          }
          res.statusCode = 405
          res.end('{"error":"method not allowed"}')
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(e) }))
        }
      })

      // --- 2. reverse proxy to the arm backend ---
      // Hardened so NO backend error can crash the Vite Node process (which would
      // otherwise drop the dev server and force a full page reload — "黑屏闪一下").
      const proxy = createProxyServer({ changeOrigin: true, ws: true })

      // proxy 'error' fires for both HTTP (3rd arg = ServerResponse) and WS
      // (3rd arg = socket). Handle both shapes without throwing.
      proxy.on('error', (err, _req, resOrSocket) => {
        const r = resOrSocket as unknown
        if (r && typeof (r as { writeHead?: unknown }).writeHead === 'function') {
          const res = r as import('node:http').ServerResponse
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
          }
          res.end(JSON.stringify({ code: 'PROXY_ERROR', message: String(err) }))
        } else if (r && typeof (r as { destroy?: unknown }).destroy === 'function') {
          ;(r as import('node:net').Socket).destroy() // WS: tear down the socket
        }
      })

      // REST: /api/* → <target>/api/*  (global match: mounting at '/api' would
      // strip the prefix from req.url and the backend would 404)
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()
        const t = target()
        if (!t) return next()
        try {
          proxy.web(req, res, { target: t })
        } catch (e) {
          if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 'PROXY_ERROR', message: String(e) }))
        }
      })

      // WebSocket: upgrade requests under /api → <target> (HMR upgrades untouched)
      server.httpServer?.on('upgrade', (req, socket, head) => {
        if (!req.url?.startsWith('/api')) return
        // guard the raw socket so a client/target WS error can't bubble up uncaught
        socket.on('error', () => socket.destroy())
        const t = target()
        if (!t) return socket.destroy()
        try {
          proxy.ws(req, socket, head, { target: t })
        } catch {
          socket.destroy()
        }
      })

      // --- 3. sim videos: list + serve files from the configured directory ---
      // GET /__sim/videos → JSON list of video files (recursive) under simDir.
      server.middlewares.use('/__sim/videos', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const base = simDir()
        if (!base) return res.end('{"dir":null,"videos":[]}')
        const out: { path: string; name: string; size: number; mtime: number }[] = []
        const walk = (dir: string, depth: number) => {
          if (depth > 8 || out.length >= 1000) return
          let entries: import('node:fs').Dirent[]
          try {
            entries = readdirSync(dir, { withFileTypes: true })
          } catch {
            return
          }
          for (const e of entries) {
            const full = path.join(dir, e.name)
            if (e.isDirectory()) walk(full, depth + 1)
            else if (VIDEO_RE.test(e.name)) {
              try {
                const st = statSync(full)
                out.push({ path: path.relative(base, full), name: e.name, size: st.size, mtime: st.mtimeMs })
              } catch {
                /* skip unreadable */
              }
            }
          }
        }
        try {
          walk(base, 0)
        } catch {
          /* ignore */
        }
        out.sort((a, b) => b.mtime - a.mtime)
        res.end(JSON.stringify({ dir: base, videos: out }))
      })

      // GET /__sim/file?path=<rel> → stream a video file with HTTP Range support.
      server.middlewares.use('/__sim/file', (req, res) => {
        const base = simDir()
        if (!base) {
          res.statusCode = 404
          return res.end('no sim dir')
        }
        const rel = new URL(req.url ?? '', 'http://x').searchParams.get('path') ?? ''
        const full = path.resolve(base, rel)
        // path-traversal guard: resolved file must stay inside base
        if (full !== base && !full.startsWith(base + path.sep)) {
          res.statusCode = 403
          return res.end('forbidden')
        }
        let st: import('node:fs').Stats
        try {
          st = statSync(full)
          if (!st.isFile()) throw new Error('not a file')
        } catch {
          res.statusCode = 404
          return res.end('not found')
        }
        const type = MIME[path.extname(full).toLowerCase()] ?? 'application/octet-stream'
        res.setHeader('Content-Type', type)
        res.setHeader('Accept-Ranges', 'bytes')

        const range = req.headers.range
        const m = range && /bytes=(\d*)-(\d*)/.exec(range)
        if (m) {
          const start = m[1] ? parseInt(m[1], 10) : 0
          const end = m[2] ? parseInt(m[2], 10) : st.size - 1
          if (start >= st.size || end >= st.size || start > end) {
            res.statusCode = 416
            res.setHeader('Content-Range', `bytes */${st.size}`)
            return res.end()
          }
          res.statusCode = 206
          res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`)
          res.setHeader('Content-Length', end - start + 1)
          createReadStream(full, { start, end }).pipe(res)
        } else {
          res.setHeader('Content-Length', st.size)
          createReadStream(full).pipe(res)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const defaultTarget = env.VITE_REAL_API_URL || 'http://localhost:8080/api/v1'
  const defaultSimApi = env.VITE_SIM_API_URL || 'http://localhost:9000/api/v1'
  const defaultSimDir = env.VITE_SIM_VIDEO_BASE || ''
  return {
    plugins: [react(), tailwindcss(), serverLayerPlugin(defaultTarget, defaultSimApi, defaultSimDir)],
    server: {
      host: true, // listen on 0.0.0.0 so the VSCode SSH tunnel / LAN can reach it
      port: 5180, // dedicated port (5173 is taken by another user on this shared box)
    },
  }
})
