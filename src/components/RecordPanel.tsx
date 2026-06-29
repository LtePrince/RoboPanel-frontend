import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleDot, Square, Loader2 } from 'lucide-react'
import { Card } from './ui/Card'
import { StatusDot } from './ui/StatusDot'
import { cn } from '../lib/cn'
import { ApiError, type ApiClient } from '../lib/api'

interface Props {
  api: ApiClient
  /** Called after a recording starts or stops, so the demo list can refresh. */
  onChange?: () => void
  /** Let the backend auto-assign the demo number (sim); hides the number input. */
  autoNumber?: boolean
  /** Enable R = start / C = stop keyboard shortcuts (sim teleop flow). */
  keyboard?: boolean
}

export function RecordPanel({ api, onChange, autoNumber, keyboard }: Props) {
  const [demoNum, setDemoNum] = useState(0)
  const [running, setRunning] = useState(false)
  const [pid, setPid] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number | null>(null)

  const pollStatus = useCallback(async () => {
    try {
      const s = await api.record.status()
      setRunning(s.running)
      setPid(s.pid)
      if (s.running && startedAt.current === null) startedAt.current = Date.now()
      if (!s.running) startedAt.current = null
    } catch {
      /* leave previous status on transient errors */
    }
  }, [api])

  // poll recorder status every 2s, and tick the elapsed timer every 1s
  useEffect(() => {
    pollStatus()
    const poll = setInterval(pollStatus, 2000)
    const tick = setInterval(() => {
      setElapsed(startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : 0)
    }, 1000)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [pollStatus])

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await api.record.start(autoNumber ? undefined : demoNum)
      setRunning(true)
      setPid(r.pid)
      if (typeof r.demo_num === 'number') setDemoNum(r.demo_num)
      startedAt.current = Date.now()
      onChange?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'failed to start')
    } finally {
      setBusy(false)
    }
  }

  const stop = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.record.stop()
      setRunning(false)
      startedAt.current = null
      onChange?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'failed to stop')
    } finally {
      setBusy(false)
    }
  }

  // R = start / C = stop shortcuts (refs avoid stale-closure reads of state)
  const runningRef = useRef(running)
  runningRef.current = running
  const busyRef = useRef(busy)
  busyRef.current = busy
  const startRef = useRef(start)
  startRef.current = start
  const stopRef = useRef(stop)
  stopRef.current = stop
  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return
      const k = e.key.toLowerCase()
      if (k === 'r' && !runningRef.current && !busyRef.current) startRef.current()
      else if (k === 'c' && runningRef.current && !busyRef.current) stopRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyboard])

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <Card
      title="Data Collection"
      icon={CircleDot}
      action={
        <StatusDot
          tone={running ? 'bad' : 'idle'}
          label={running ? 'recording' : 'idle'}
          pulse={running}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-3">
          {autoNumber ? (
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[11px] tracking-wide text-text/60 uppercase">Demo</span>
              <span className="tnum px-1 py-2 text-text-strong">demo_{demoNum}（自动编号）</span>
            </div>
          ) : (
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[11px] tracking-wide text-text/60 uppercase">Demo number</span>
              <input
                type="number"
                min={0}
                value={demoNum}
                disabled={running || busy}
                onChange={(e) => setDemoNum(Math.max(0, Number(e.target.value)))}
                className="tnum w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-text-strong outline-none focus:border-accent disabled:opacity-50"
              />
            </label>
          )}

          {!running ? (
            <button
              type="button"
              onClick={start}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CircleDot className="size-4" />}
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-bad px-4 py-2 font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4" />}
              Stop
            </button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm">
          <span className="text-text/70">{running ? `demo_${demoNum} • pid ${pid ?? '—'}` : 'Not recording'}</span>
          <span className={cn('tnum', running ? 'text-bad' : 'text-text/50')}>{mmss}</span>
        </div>

        {error && <p className="text-sm text-bad">{error}</p>}
        {keyboard && (
          <p className="text-[11px] text-text/50">R 开始录制（自动重置）· C 停止保存（自动重置）</p>
        )}
      </div>
    </Card>
  )
}
