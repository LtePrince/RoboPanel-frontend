import { useCallback, useEffect, useState } from 'react'
import { MonitorPlay, Film, RefreshCw, Info, Check, X } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { cn } from '../lib/cn'
import { formatBytes, timeAgo } from '../lib/format'

interface SimVideo {
  path: string
  name: string
  size: number
  mtime: number
}

const fileUrl = (rel: string) => `/__sim/file?path=${encodeURIComponent(rel)}`

/** Parse the success flag encoded in FastWAM/LIBERO video filenames. */
function successFlag(name: string): boolean | null {
  if (/success=true/i.test(name)) return true
  if (/success=false/i.test(name)) return false
  return null
}

/**
 * Simulation view. Browses video files under the configured sim directory
 * (default: FastWAM evaluate_results) via the dev server, and plays them with
 * range support. The directory is read server-side because the browser can't.
 */
export function SimView() {
  const [videos, setVideos] = useState<SimVideo[]>([])
  const [dir, setDir] = useState<string | null>(null)
  const [active, setActive] = useState<SimVideo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/__sim/videos')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { dir: string | null; videos: SimVideo[] }
      setDir(data.dir)
      setVideos(data.videos ?? [])
      setActive((prev) => prev ?? data.videos?.[0] ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to list videos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card title="仿真视频" icon={MonitorPlay}>
          {active ? (
            <div className="flex flex-col gap-2">
              <video
                key={active.path}
                src={fileUrl(active.path)}
                controls
                autoPlay
                className="w-full rounded-lg bg-black"
              />
              <p className="tnum text-xs break-all text-text/60">{active.path}</p>
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-panel-2 text-text/60">
              <Film className="size-10" />
              <span className="text-sm">{loading ? '加载中…' : '该目录下没有视频'}</span>
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card
          title="视频列表"
          icon={Film}
          action={
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text hover:bg-panel-2 hover:text-text-strong"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              {videos.length}
            </button>
          }
        >
          {error && <p className="mb-3 text-sm text-bad">{error}</p>}
          {videos.length === 0 && !loading ? (
            <p className="py-6 text-center text-sm text-text/60">目录中没有视频文件。</p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto pr-1">
              {videos.map((v) => {
                const ok = successFlag(v.name)
                const isActive = active?.path === v.path
                return (
                  <li key={v.path}>
                    <button
                      type="button"
                      onClick={() => setActive(v)}
                      title={v.path}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition',
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'text-text hover:bg-panel-2 hover:text-text-strong',
                      )}
                    >
                      {ok === true && <Check className="size-4 shrink-0 text-ok" />}
                      {ok === false && <X className="size-4 shrink-0 text-bad" />}
                      {ok === null && <Film className="size-4 shrink-0 text-text/50" />}
                      <span className="min-w-0 flex-1 truncate text-sm">{v.name}</span>
                      <span className="tnum shrink-0 text-xs text-text/50">{formatBytes(v.size)}</span>
                    </button>
                    {isActive && (
                      <span className="tnum block px-3 pb-1 text-[11px] text-text/40">
                        {timeAgo(v.mtime)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-panel px-4 py-3 text-xs text-text/70">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="min-w-0">
            视频目录：
            <span className="tnum break-all text-text-strong">{dir ?? '未配置'}</span>
            （默认 FastWAM evaluate_results，可在「设置」中修改）。
          </div>
        </div>
      </div>
    </div>
  )
}
