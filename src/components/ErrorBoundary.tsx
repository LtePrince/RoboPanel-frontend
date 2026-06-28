import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  info: ErrorInfo | null
}

/**
 * Catches render-phase exceptions so a single broken component degrades to a
 * readable error card instead of blanking the whole app. Note: React error
 * boundaries only catch errors during render/lifecycle — NOT in event handlers
 * or async code (those can't unmount the tree, so they never blank the screen).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // surface to the console so the stack is available for diagnosis
    console.error('[RoboPanel] render error caught by ErrorBoundary:', error, info)
    this.setState({ info })
  }

  private reset = () => this.setState({ error: null, info: null })

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children

    return (
      <div className="rounded-xl border border-bad/40 bg-panel p-5">
        <div className="flex items-center gap-2 text-bad">
          <AlertTriangle className="size-5" />
          <h2 className="text-base font-semibold">界面出错了（已被 ErrorBoundary 拦截）</h2>
        </div>
        <p className="mt-2 text-sm text-text">
          某个组件在渲染时抛了异常。整个面板没有崩溃；下面是错误详情，也已打印到浏览器控制台。
        </p>

        <pre className="tnum mt-3 max-h-48 overflow-auto rounded-lg bg-panel-2 p-3 text-xs whitespace-pre-wrap text-bad">
          {error.message}
          {info?.componentStack ? `\n${info.componentStack}` : ''}
        </pre>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text hover:bg-panel-2 hover:text-text-strong"
          >
            <RotateCcw className="size-4" /> 重试渲染
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            <RefreshCw className="size-4" /> 重新加载
          </button>
        </div>
      </div>
    )
  }
}
