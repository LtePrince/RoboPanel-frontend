import { useCallback, useEffect, useRef, useState } from 'react'

export type CtrlStatus = 'connecting' | 'open' | 'closed'

/** Opens the teleop control WebSocket (client→server) and exposes send(). */
export function useControlSocket(wsUrl: string, enabled: boolean) {
  const wsRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<CtrlStatus>('connecting')

  useEffect(() => {
    if (!enabled) {
      setStatus('closed')
      return
    }
    let ws: WebSocket | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let closedByUs = false
    let backoff = 500

    const connect = () => {
      setStatus('connecting')
      ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => {
        backoff = 500
        setStatus('open')
      }
      ws.onclose = () => {
        setStatus('closed')
        if (!closedByUs) {
          timer = setTimeout(connect, backoff)
          backoff = Math.min(backoff * 2, 5000)
        }
      }
      ws.onerror = () => ws?.close()
    }
    connect()

    return () => {
      closedByUs = true
      if (timer) clearTimeout(timer)
      ws?.close()
      wsRef.current = null
    }
  }, [wsUrl, enabled])

  const send = useCallback((obj: unknown) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj))
  }, [])

  return { send, status }
}
