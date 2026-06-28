import { useMemo, useState } from 'react'
import { Video, Pause, Play, Loader2, CameraOff } from 'lucide-react'
import { Card } from './ui/Card'
import { cn } from '../lib/cn'
import { useCameraStream } from '../hooks/useCameraStream'
import { browserWsUrl } from '../lib/settings'

interface Props {
  /** Arm backend (proxy target); the camera WS is derived from its path. */
  target: string
}

export function CameraPanel({ target }: Props) {
  const [enabled, setEnabled] = useState(true)
  const wsUrl = useMemo(() => browserWsUrl(target, '/ws/camera'), [target])
  const { frameUrl, status, fps } = useCameraStream(wsUrl, enabled, target)

  const live = status === 'open' && frameUrl !== null

  return (
    <Card
      title="Camera — RealSense"
      icon={Video}
      action={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs">
            {live ? (
              <>
                <span className="size-2 rounded-full bg-ok" />
                <span className="tnum text-text">{fps} fps</span>
              </>
            ) : (
              <span className="text-text/60">
                {status === 'paused' ? '已暂停' : status === 'connecting' ? '连接中…' : '重连中…'}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setEnabled((e) => !e)}
            title={enabled ? '暂停（释放摄像头）' : '开启'}
            className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-text hover:bg-panel-2 hover:text-text-strong"
          >
            {enabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {enabled ? '暂停' : '开启'}
          </button>
        </div>
      }
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
        {frameUrl && enabled ? (
          <img
            src={frameUrl}
            alt="camera"
            className="absolute inset-0 size-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text/50">
            {!enabled ? (
              <>
                <CameraOff className="size-10" />
                <span className="text-sm">摄像头已暂停</span>
                <button
                  type="button"
                  onClick={() => setEnabled(true)}
                  className="mt-1 flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
                >
                  <Play className="size-4" /> 开启画面
                </button>
              </>
            ) : (
              <>
                <Loader2 className="size-8 animate-spin" />
                <span className="text-sm">
                  {status === 'open' ? '等待画面…' : '连接摄像头…'}
                </span>
              </>
            )}
          </div>
        )}

        {live && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-ok">
            <span className={cn('size-1.5 rounded-full bg-ok')} /> LIVE
          </span>
        )}
      </div>
    </Card>
  )
}
