# RoboPanel — Frontend

Web panel for a robot arm, with two modes switchable in the header:

- **真机 (real)** — live physical-state monitoring + demo data collection,
  talking to [`RoboPanel-backend`](../RoboPanel-backend) (Go / Gin) on the arm.
- **仿真 (sim)** — simulation view; currently a video-file viewer (connection to
  a sim backend is TBD, since robot models differ).

> Teleoperation is handled by the server-side gamepad, so this panel is
> read/record only — it does **not** send motion commands.

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v4 + lucide-react + react-router
(matches the blog frontend's styling stack).

## Dev server layer (in `vite.config.ts`)

The Vite dev server hosts two server-side middlewares (same Node process) so the
browser only ever talks to this same-origin frontend:

- **`/__config`** — reads/writes the runtime override to `robopanel.settings.json`
  (project root, gitignored). The SPA analog of BlogManager's `manager-settings.json`
  — the browser can't write files, so the dev server does it.
- **`/api/*` + WS upgrade** — dynamic reverse proxy to the arm backend. The target
  origin is read from the config file **on each request**, so changing the backend
  in Settings takes effect **without restarting** the dev server. REST and the
  20 Hz WebSocket are both proxied; a dead target returns `502` (no crash).

This means: no CORS, and the arm only needs to be reachable from the machine
running `npm run dev` (not from your laptop). Both middlewares are **dev-only**
(a static prod build has no Node server).

## Config — two layers (like BlogManager)

1. **Baseline defaults** — build-time `.env` (`VITE_REAL_API_URL`, `VITE_SIM_VIDEO_BASE`).
   `VITE_REAL_API_URL` is also the default proxy target.
2. **Runtime override** — edited in the **设置 (Settings)** page, persisted to
   `robopanel.settings.json` via `/__config` (file on disk, not browser storage).

Effective config = defaults overlaid with the file override.

```bash
npm install
cp .env.example .env       # optional: set baseline defaults / default proxy target
npm run dev                # http://localhost:5180
```

You can also just open the panel and set the arm backend in **设置** at runtime.

## Routes

| Path | Page |
|---|---|
| `/` | 监控 — telemetry (real) or sim video (sim), per the header toggle |
| `/settings` | 设置 — backend address + sim video source (locked/编辑/保存) |

## Real mode — backend API contract

The browser calls these at the same-origin path (e.g. `/api/v1/...`); the dev
proxy forwards to the arm. Envelope `{code, message, data}`:

| Method | Path | Used for |
|---|---|---|
| WS | `/ws/state` | live 20 Hz state stream |
| GET | `/robot/state` | one-shot state (WS preferred) |
| POST | `/record/start` `{demo_num}` | start recording |
| POST | `/record/stop` | stop recording |
| GET | `/record/status` | poll recorder status |
| GET | `/demos` | list recorded demos |
| GET | `/demos/:name/files/:file` | download a file |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |

## Layout

```
vite.config.ts                 # dev server layer: /__config writer + dynamic /api proxy
src/
├── types.ts                   # mirrors backend schema
├── lib/
│   ├── settings.ts            # 2-layer config (env defaults + JSON file); api path/ws helpers
│   ├── api.ts                 # createApi(prefix) → typed client; ApiError
│   ├── cn.ts                  # clsx + tailwind-merge
│   └── format.ts              # telemetry formatting helpers
├── context/
│   └── SettingsContext.tsx    # settings + real/sim mode, persisted to the config file
├── hooks/
│   └── useRobotState.ts       # WebSocket state stream (reconnects on target change)
├── components/
│   ├── ui/                    # Card, Stat, StatusDot
│   ├── AppHeader.tsx          # nav (监控/设置) + 真机/仿真 toggle
│   ├── ConnectionStatus.tsx   # live/arm/base health strip
│   ├── JointStatePanel.tsx    # arm joints
│   ├── CartesianPanel.tsx     # tool pose
│   ├── BasePanel.tsx          # base odometry
│   ├── NavPanel.tsx           # nav status + battery
│   ├── RecordPanel.tsx        # recorder control
│   └── DemosPanel.tsx         # demo browser / download
└── pages/
    ├── Dashboard.tsx          # 监控: dispatches real vs sim
    ├── RealDashboard.tsx      # real-mode telemetry grid
    ├── SimView.tsx            # sim-mode video viewer
    └── SettingsPage.tsx       # config editor
```
