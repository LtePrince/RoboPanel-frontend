import { useCallback, useEffect, useState } from 'react'
import { Database, Download, RefreshCw, Folder, ChevronRight } from 'lucide-react'
import { Card } from './ui/Card'
import { cn } from '../lib/cn'
import { ApiError, type ApiClient } from '../lib/api'
import { formatBytes, timeAgo } from '../lib/format'
import type { Demo } from '../types'

interface Props {
  api: ApiClient
  /** Bump to force a reload (e.g. after a recording finishes). */
  refreshSignal?: number
}

export function DemosPanel({ api, refreshSignal }: Props) {
  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.demos.list()
      setDemos(r.demos.sort((a, b) => b.created_at - a.created_at))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'failed to load demos')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    load()
  }, [load, refreshSignal])

  return (
    <Card
      title="Recorded Demos"
      icon={Database}
      action={
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text hover:bg-panel-2 hover:text-text-strong"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          {demos.length} total
        </button>
      }
    >
      {error && <p className="mb-3 text-sm text-bad">{error}</p>}

      {demos.length === 0 && !loading ? (
        <p className="py-6 text-center text-sm text-text/60">No demos recorded yet.</p>
      ) : (
        <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
          {demos.map((demo) => {
            const isOpen = open === demo.name
            return (
              <li key={demo.name} className="rounded-lg border border-border bg-panel-2">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : demo.name)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  <ChevronRight
                    className={cn('size-4 shrink-0 text-text/50 transition', isOpen && 'rotate-90')}
                  />
                  <Folder className="size-4 shrink-0 text-accent" />
                  <span className="flex-1 truncate text-sm text-text-strong">{demo.name}</span>
                  <span className="text-xs text-text/50">{demo.files.length} files</span>
                  <span className="tnum hidden text-xs text-text/40 sm:inline">
                    {timeAgo(demo.created_at)}
                  </span>
                </button>

                {isOpen && (
                  <ul className="border-t border-border px-3 py-2">
                    {demo.files.length === 0 ? (
                      <li className="py-1 text-xs text-text/50">empty</li>
                    ) : (
                      demo.files.map((f) => (
                        <li
                          key={f.name}
                          className="flex items-center gap-2 py-1 text-sm"
                        >
                          <span className="flex-1 truncate text-text">{f.name}</span>
                          <span className="tnum text-xs text-text/50">{formatBytes(f.size)}</span>
                          <a
                            href={api.demos.fileUrl(demo.name, f.name)}
                            download
                            className="rounded p-1 text-text/60 hover:bg-panel hover:text-accent"
                            title="Download"
                          >
                            <Download className="size-4" />
                          </a>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
