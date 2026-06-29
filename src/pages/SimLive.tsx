import { useEffect, useMemo, useState } from 'react'
import { CameraPanel } from '../components/CameraPanel'
import { JointStatePanel } from '../components/JointStatePanel'
import { CartesianPanel } from '../components/CartesianPanel'
import { BasePanel } from '../components/BasePanel'
import { NavPanel } from '../components/NavPanel'
import { RecordPanel } from '../components/RecordPanel'
import { DemosPanel } from '../components/DemosPanel'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { TeleopPanel } from '../components/TeleopPanel'
import { SimControls } from '../components/SimControls'
import { useRobotState } from '../hooks/useRobotState'
import { createApi } from '../lib/api'
import { apiPathPrefix, browserWsUrl } from '../lib/settings'
import { useSettings } from '../context/SettingsContext'
import type { RobotInfo } from '../types'

export function SimLive() {
  const { settings } = useSettings()
  const target = settings.simApiUrl // sim backend (proxy routes here in sim mode)

  const api = useMemo(() => createApi(apiPathPrefix(target)), [target])
  const wsUrl = useMemo(() => browserWsUrl(target), [target])
  const { state, wsStatus, lastFrameAgo } = useRobotState(wsUrl, `${target}|sim`)
  const [demosRefresh, setDemosRefresh] = useState(0)
  const [info, setInfo] = useState<RobotInfo | null>(null)

  // model descriptor → which panels to render + teleop availability
  useEffect(() => {
    let alive = true
    api.getInfo().then((i) => alive && setInfo(i)).catch(() => alive && setInfo(null))
    return () => { alive = false }
  }, [api])

  const teleopOn = info?.teleop?.enabled ?? false
  const sim = state?.sim

  return (
    <div className="flex flex-col gap-4">
      <ConnectionStatus
        apiUrl={target}
        wsStatus={wsStatus}
        lastFrameAgo={lastFrameAgo}
        armConnected={state?.arm_connected ?? false}
        baseConnected={state?.base_connected ?? false}
      />

      {sim && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-panel px-4 py-2 text-sm">
          <span className="text-text-strong">{info?.display_name ?? sim.suite}</span>
          <span className="text-text/70">任务：{sim.task || `${sim.suite} #${sim.task_id}`}</span>
          <span className="tnum text-text/50">step {sim.step}</span>
          {sim.success && <span className="text-ok">✓ 任务完成（可继续遥操或点重置）</span>}
          {sim.done && !sim.success && <span className="text-warn">回合结束（点重置）</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <CameraPanel target={target} />
          <JointStatePanel joints={state?.joint_state} connected={state?.arm_connected ?? false} />
          <CartesianPanel pose={state?.cartesian_state} />
          {info?.has_base && (
            <BasePanel base={state?.base_state ?? undefined} connected={state?.base_connected ?? false} />
          )}
          {info?.has_nav && <NavPanel nav={state?.nav_state ?? undefined} />}
        </div>

        <div className="flex flex-col gap-4">
          <SimControls api={api} />
          {teleopOn && <TeleopPanel target={target} enabled={teleopOn} />}
          <RecordPanel api={api} autoNumber keyboard onChange={() => setDemosRefresh((n) => n + 1)} />
          <DemosPanel api={api} refreshSignal={demosRefresh} />
        </div>
      </div>
    </div>
  )
}
