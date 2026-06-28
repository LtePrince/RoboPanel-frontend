import { useEffect, useRef, useState } from 'react'

export type CamStatus = 'connecting' | 'open' | 'closed' | 'paused'

interface UseCameraStream {
  /** Object URL of the latest JPEG frame, or null if none yet. */
  frameUrl: string | null
  status: CamStatus
  /** Frames per second over the last ~1s window. */
  fps: number
}

/**
 * Streams JPEG frames from the backend camera WebSocket (binary messages, one
 * JPEG per message). Connects only when `enabled` — the backend stops the camera
 * when no client is connected, so pausing frees the USB device. Auto-reconnects
 * with backoff and re-dials when `wsUrl`/`reconnectKey` change.
 */
export function useCameraStream(
  wsUrl: string,
  enabled: boolean,
  reconnectKey?: string,
): UseCameraStream {
  const [frameUrl, setFrameUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<CamStatus>('connecting')
  const [fps, setFps] = useState(0)

  const urlRef = useRef<string | null>(null)
  const frameCount = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setStatus('paused')
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
      setFrameUrl(null)
      setFps(0)
      return
    }

    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closedByUs = false
    let backoff = 500

    const connect = () => {
      setStatus('connecting')
      ws = new WebSocket(wsUrl)
      ws.binaryType = 'blob'

      ws.onopen = () => {
        backoff = 500
        setStatus('open')
      }
      ws.onmessage = (ev) => {
        if (!(ev.data instanceof Blob)) return
        const next = URL.createObjectURL(ev.data)
        const prev = urlRef.current
        urlRef.current = next
        setFrameUrl(next)
        if (prev) URL.revokeObjectURL(prev)
        frameCount.current++
      }
      ws.onclose = () => {
        setStatus('closed')
        if (!closedByUs) {
          reconnectTimer = setTimeout(connect, backoff)
          backoff = Math.min(backoff * 2, 5000)
        }
      }
      ws.onerror = () => ws?.close()
    }

    connect()

    const fpsTimer = setInterval(() => {
      setFps(frameCount.current)
      frameCount.current = 0
    }, 1000)

    return () => {
      closedByUs = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      clearInterval(fpsTimer)
      ws?.close()
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [wsUrl, enabled, reconnectKey])

  return { frameUrl, status, fps }
}
