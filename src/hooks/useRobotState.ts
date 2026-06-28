import { useEffect, useRef, useState } from 'react'
import type { RobotState } from '../types'

export type WsStatus = 'connecting' | 'open' | 'closed'

interface UseRobotState {
  state: RobotState | null
  /** WebSocket transport status (is the panel talking to the backend). */
  wsStatus: WsStatus
  /** ms since the last state frame, or null if none received yet. */
  lastFrameAgo: number | null
}

/**
 * Subscribes to the backend's 20 Hz state stream over WebSocket and exposes the
 * latest snapshot. Auto-reconnects with backoff. Reconnects whenever `wsUrl` or
 * `reconnectKey` changes — the latter lets us re-dial the proxy when the arm
 * target is edited in Settings even though the same-origin `wsUrl` is unchanged.
 */
export function useRobotState(wsUrl: string, reconnectKey?: string): UseRobotState {
  const [state, setState] = useState<RobotState | null>(null)
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting')
  const [lastFrameAgo, setLastFrameAgo] = useState<number | null>(null)

  const lastFrameAt = useRef<number | null>(null)

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closedByUs = false
    let backoff = 500

    // reset frame tracking when the target changes
    lastFrameAt.current = null
    setState(null)

    const connect = () => {
      setWsStatus('connecting')
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        backoff = 500
        setWsStatus('open')
      }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as RobotState
          lastFrameAt.current = Date.now()
          setState(data)
        } catch {
          /* ignore malformed frame */
        }
      }
      ws.onclose = () => {
        setWsStatus('closed')
        if (!closedByUs) {
          reconnectTimer = setTimeout(connect, backoff)
          backoff = Math.min(backoff * 2, 5000)
        }
      }
      ws.onerror = () => ws?.close()
    }

    connect()

    const ageTimer = setInterval(() => {
      setLastFrameAgo(lastFrameAt.current ? Date.now() - lastFrameAt.current : null)
    }, 250)

    return () => {
      closedByUs = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      clearInterval(ageTimer)
      ws?.close()
    }
  }, [wsUrl, reconnectKey])

  return { state, wsStatus, lastFrameAgo }
}
