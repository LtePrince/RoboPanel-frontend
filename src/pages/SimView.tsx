import { useEffect, useRef, useState } from 'react'
import { MonitorPlay, Upload, Film, Info } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { cn } from '../lib/cn'
import { formatBytes } from '../lib/format'
import { useSettings } from '../context/SettingsContext'

interface LocalVideo {
  id: string
  name: string
  size: number
  url: string
}

/**
 * Simulation view. Robot models differ across sims, so for now this only
 * displays video files (e.g. eval rollouts). The backend connection is TBD —
 * currently videos are loaded from local disk; a remote source can be wired in
 * later via `simVideoBase` in Settings.
 */
export function SimView() {
  const { settings } = useSettings()
  const [videos, setVideos] = useState<LocalVideo[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // revoke object URLs on unmount to avoid leaks
  useEffect(() => {
    return () => videos.forEach((v) => URL.revokeObjectURL(v.url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const next: LocalVideo[] = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}`,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
    }))
    setVideos((prev) => {
      const merged = [...prev]
      for (const v of next) if (!merged.some((m) => m.id === v.id)) merged.push(v)
      return merged
    })
    if (next.length && !activeId) setActiveId(next[0].id)
  }

  const active = videos.find((v) => v.id === activeId) ?? null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card title="仿真视频" icon={MonitorPlay}>
          {active ? (
            <div className="flex flex-col gap-2">
              <video
                key={active.id}
                src={active.url}
                controls
                autoPlay
                className="w-full rounded-lg bg-black"
              />
              <p className="tnum text-xs text-text/60">{active.name}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-panel-2 text-text/60 transition hover:border-accent hover:text-accent"
            >
              <Film className="size-10" />
              <span className="text-sm">选择视频文件预览</span>
            </button>
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
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-bg hover:opacity-90"
            >
              <Upload className="size-3.5" /> 添加
            </button>
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
          {videos.length === 0 ? (
            <p className="py-6 text-center text-sm text-text/60">尚未加载视频。</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
              {videos.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(v.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                      v.id === activeId
                        ? 'bg-accent-soft text-accent'
                        : 'text-text hover:bg-panel-2 hover:text-text-strong',
                    )}
                  >
                    <Film className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{v.name}</span>
                    <span className="tnum text-xs text-text/50">{formatBytes(v.size)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-panel px-4 py-3 text-xs text-text/70">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" />
          <div>
            仿真后端尚未接入，当前为本地视频预览。
            <br />
            配置的仿真视频来源：
            <span className="tnum text-text-strong">{settings.simVideoBase || '未配置'}</span>
            （在「设置」中修改）。
          </div>
        </div>
      </div>
    </div>
  )
}
