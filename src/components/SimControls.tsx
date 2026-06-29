import { useCallback, useEffect, useState } from 'react'
import { ListChecks, RotateCcw, Loader2, Play } from 'lucide-react'
import { Card } from './ui/Card'
import { ApiError, type ApiClient } from '../lib/api'
import type { SimTasks } from '../types'

interface Props {
  api: ApiClient
}

export function SimControls({ api }: Props) {
  const [tasks, setTasks] = useState<SimTasks | null>(null)
  const [suite, setSuite] = useState('')
  const [taskId, setTaskId] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const t = await api.sim.tasks()
      setTasks(t)
      setSuite((s) => s || t.current.suite)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'failed to load tasks')
    }
  }, [api])

  useEffect(() => {
    load()
  }, [load])

  const doLoad = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.sim.load(suite, taskId)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'load failed')
    } finally {
      setBusy(false)
    }
  }

  const doReset = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.sim.reset()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'reset failed')
    } finally {
      setBusy(false)
    }
  }

  const nTasks = tasks?.current.suite === suite ? tasks.current.tasks.length : 10

  return (
    <Card title="仿真任务" icon={ListChecks}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] tracking-wide text-text/60 uppercase">Suite</span>
            <select
              value={suite}
              onChange={(e) => setSuite(e.target.value)}
              className="rounded-lg border border-border bg-panel-2 px-2 py-2 text-sm text-text-strong outline-none focus:border-accent"
            >
              {(tasks?.suites ?? []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] tracking-wide text-text/60 uppercase">Task</span>
            <select
              value={taskId}
              onChange={(e) => setTaskId(Number(e.target.value))}
              className="rounded-lg border border-border bg-panel-2 px-2 py-2 text-sm text-text-strong outline-none focus:border-accent"
            >
              {Array.from({ length: nTasks }, (_, i) => (
                <option key={i} value={i}>#{i}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={doLoad}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} 加载
          </button>
          <button
            type="button"
            onClick={doReset}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text hover:bg-panel-2 hover:text-text-strong disabled:opacity-50"
          >
            <RotateCcw className="size-4" /> 重置
          </button>
        </div>

        {tasks && (
          <p className="text-xs text-text/60">
            当前：<span className="text-text-strong">{tasks.current.suite} #{tasks.current.task_id}</span>
            {tasks.current.tasks[tasks.current.task_id] && (
              <span className="block truncate">{tasks.current.tasks[tasks.current.task_id]}</span>
            )}
          </p>
        )}
        {error && <p className="text-sm text-bad">{error}</p>}
      </div>
    </Card>
  )
}
