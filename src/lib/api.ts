import type {
  ApiResponse,
  RobotState,
  RecordStartResp,
  RecordStatusResp,
  DemoListResp,
} from '../types'

/** Thrown when the backend returns a non-OK code or a transport error occurs. */
export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

/**
 * Build a typed API client bound to a backend prefix (e.g. http://arm:8080/api/v1).
 * Recreated whenever the active backend changes so requests follow Settings.
 */
export function createApi(prefix: string) {
  const base = prefix.replace(/\/+$/, '')

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response
    try {
      res = await fetch(`${base}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      })
    } catch (e) {
      throw new ApiError('NETWORK_ERROR', (e as Error).message || 'network error')
    }

    let body: ApiResponse<T>
    try {
      body = await res.json()
    } catch {
      throw new ApiError('BAD_RESPONSE', `HTTP ${res.status}: invalid JSON body`)
    }

    if (!res.ok || body.code !== 'OK') {
      throw new ApiError(body.code || `HTTP_${res.status}`, body.message || 'request failed')
    }
    return body.data as T
  }

  return {
    baseUrl: base,
    getState: () => request<RobotState>('/robot/state'),

    record: {
      start: (demoNum: number) =>
        request<RecordStartResp>('/record/start', {
          method: 'POST',
          body: JSON.stringify({ demo_num: demoNum }),
        }),
      stop: () => request<{ message: string }>('/record/stop', { method: 'POST' }),
      status: () => request<RecordStatusResp>('/record/status'),
    },

    demos: {
      list: () => request<DemoListResp>('/demos'),
      fileUrl: (demo: string, file: string) =>
        `${base}/demos/${encodeURIComponent(demo)}/files/${encodeURIComponent(file)}`,
    },
  }
}

export type ApiClient = ReturnType<typeof createApi>
