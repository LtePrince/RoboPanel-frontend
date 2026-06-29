import { useEffect, useState } from 'react'
import { Bot, MonitorPlay, Pencil, Save, RotateCcw } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { cn } from '../lib/cn'
import { useSettings } from '../context/SettingsContext'
import { envDefaults, type Settings } from '../lib/settings'

interface FieldProps {
  label: string
  hint?: string
  value: string
  placeholder?: string
  locked: boolean
  onUnlock: () => void
  onChange: (v: string) => void
}

/** A locked-by-default field: click 更改 to edit (mirrors BlogManager). */
function LockableField({ label, hint, value, placeholder, locked, onUnlock, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-text-strong">{label}</span>
      {hint && <span className="text-xs text-text/50">{hint}</span>}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'tnum flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition',
            locked
              ? 'border-border bg-panel-2 text-text/60'
              : 'border-accent bg-panel text-text-strong',
          )}
        />
        <button
          type="button"
          onClick={onUnlock}
          disabled={!locked}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text transition hover:bg-panel-2 hover:text-text-strong disabled:opacity-40"
        >
          <Pencil className="size-3.5" /> 更改
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [draft, setDraft] = useState<Settings>(settings)
  const [locked, setLocked] = useState({ realApiUrl: true, simApiUrl: true, simVideoBase: true })
  const allLocked = locked.realApiUrl && locked.simApiUrl && locked.simVideoBase

  // settings hydrate asynchronously from the config file; follow them while not editing
  useEffect(() => {
    if (allLocked) setDraft(settings)
  }, [settings, allLocked])

  const dirty =
    draft.realApiUrl !== settings.realApiUrl ||
    draft.simApiUrl !== settings.simApiUrl ||
    draft.simVideoBase !== settings.simVideoBase

  const set = (key: keyof Settings, v: string) => setDraft((d) => ({ ...d, [key]: v }))

  const save = () => {
    updateSettings({
      realApiUrl: draft.realApiUrl.trim(),
      simApiUrl: draft.simApiUrl.trim(),
      simVideoBase: draft.simVideoBase.trim(),
    })
    setLocked({ realApiUrl: true, simApiUrl: true, simVideoBase: true })
  }

  const reset = () => {
    resetSettings()
    setDraft(envDefaults())
    setLocked({ realApiUrl: true, simApiUrl: true, simVideoBase: true })
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-text-strong">设置</h1>
        <p className="mt-1 text-sm text-text/60">
          配置后端地址与仿真视频来源。每项默认锁定，点「更改」后才可编辑；保存即时生效（写入浏览器 localStorage，可覆盖 .env 默认值）。
        </p>
      </div>

      <Card title="真机后端" icon={Bot}>
        <LockableField
          label="机械臂后端地址（代理目标）"
          hint="dev 服务端会把同源 /api 请求转发到这里，例如 http://192.168.1.50:8088/api/v1。改了即时生效，无需重启。"
          value={draft.realApiUrl}
          placeholder="http://host:8080/api/v1"
          locked={locked.realApiUrl}
          onUnlock={() => setLocked((l) => ({ ...l, realApiUrl: false }))}
          onChange={(v) => set('realApiUrl', v)}
        />
      </Card>

      <Card title="仿真" icon={MonitorPlay}>
        <div className="flex flex-col gap-5">
        <LockableField
          label="仿真后端地址（代理目标）"
          hint="RoboPanel-Simbackend 的 /api/v1，例如 http://localhost:9000/api/v1。仿真模式下同源 /api 转发到这里。"
          value={draft.simApiUrl}
          placeholder="http://localhost:9000/api/v1"
          locked={locked.simApiUrl}
          onUnlock={() => setLocked((l) => ({ ...l, simApiUrl: false }))}
          onChange={(v) => set('simApiUrl', v)}
        />
        <LockableField
          label="仿真视频目录（本地路径）"
          hint="dev 服务端从该目录读取并播放视频，默认 FastWAM 评估结果目录。留空则用 .env 默认值。"
          value={draft.simVideoBase}
          placeholder="/home/ziyaowang/Alvin/WAM/FastWAM/evaluate_results"
          locked={locked.simVideoBase}
          onUnlock={() => setLocked((l) => ({ ...l, simVideoBase: false }))}
          onChange={(v) => set('simVideoBase', v)}
        />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text transition hover:bg-panel-2 hover:text-text-strong"
        >
          <RotateCcw className="size-4" /> 恢复默认
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition',
            dirty ? 'bg-accent text-bg hover:opacity-90' : 'bg-accent/30 text-bg/60',
          )}
        >
          <Save className="size-4" /> 保存
        </button>
      </div>
    </div>
  )
}
