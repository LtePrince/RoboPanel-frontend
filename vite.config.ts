import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { promises as fsp, readFileSync } from 'node:fs'
import path from 'node:path'
import { createProxyServer } from 'http-proxy-3'

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
function serverLayerPlugin(envDefaultTarget: string): Plugin {
  /** Current proxy target origin (e.g. http://arm:8088), from config or .env. */
  function target(): string | null {
    let url = envDefaultTarget
    try {
      const cfg = JSON.parse(readFileSync(configPath(), 'utf8')) as { realApiUrl?: string }
      if (cfg.realApiUrl) url = cfg.realApiUrl
    } catch {
      /* no override file → use .env default */
    }
    try {
      return new URL(url).origin
    } catch {
      return null
    }
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
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const defaultTarget = env.VITE_REAL_API_URL || 'http://localhost:8080/api/v1'
  return {
    plugins: [react(), tailwindcss(), serverLayerPlugin(defaultTarget)],
    server: {
      host: true, // listen on 0.0.0.0 so the VSCode SSH tunnel / LAN can reach it
      port: 5180, // dedicated port (5173 is taken by another user on this shared box)
    },
  }
})
