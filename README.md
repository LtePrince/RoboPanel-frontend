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

## Config — two layers (like BlogManager)

1. **Baseline defaults** — build-time `.env` (`VITE_REAL_API_URL`, `VITE_SIM_VIDEO_BASE`).
2. **Runtime override** — edited in the **设置 (Settings)** page, saved to browser
   **localStorage** (the SPA analog of BlogManager's `manager-settings.json`).

Effective config = defaults overlaid with the localStorage override.

```bash
npm install
cp .env.example .env       # optional: set baseline defaults
npm run dev                # http://localhost:5173
```

You can also just open the panel and set the backend in **设置** at runtime.

## Routes

| Path | Page |
|---|---|
| `/` | 监控 — telemetry (real) or sim video (sim), per the header toggle |
| `/settings` | 设置 — backend address + sim video source (locked/编辑/保存) |

## Real mode — backend API contract

Endpoints under the configured `/api/v1` prefix, envelope `{code, message, data}`:

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
src/
├── types.ts                   # mirrors backend schema
├── lib/
│   ├── settings.ts            # 2-layer config (env defaults + localStorage), ws url
│   ├── api.ts                 # createApi(prefix) → typed client; ApiError
│   ├── cn.ts                  # clsx + tailwind-merge
│   └── format.ts              # telemetry formatting helpers
├── context/
│   └── SettingsContext.tsx    # settings + real/sim mode, persisted
├── hooks/
│   └── useRobotState.ts       # WebSocket state stream (reconnects on url change)
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
