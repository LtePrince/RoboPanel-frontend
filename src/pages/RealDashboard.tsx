import { useMemo, useState } from 'react'
import { JointStatePanel } from '../components/JointStatePanel'
import { CartesianPanel } from '../components/CartesianPanel'
import { BasePanel } from '../components/BasePanel'
import { NavPanel } from '../components/NavPanel'
import { RecordPanel } from '../components/RecordPanel'
import { DemosPanel } from '../components/DemosPanel'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { useRobotState } from '../hooks/useRobotState'
import { createApi } from '../lib/api'
import { wsStateUrl } from '../lib/settings'
import { useSettings } from '../context/SettingsContext'

export function RealDashboard() {
  const { settings } = useSettings()
  const apiUrl = settings.realApiUrl

  // rebuild the client + ws url whenever the backend changes (Settings edit)
  const api = useMemo(() => createApi(apiUrl), [apiUrl])
  const wsUrl = useMemo(() => wsStateUrl(apiUrl), [apiUrl])

  const { state, wsStatus, lastFrameAgo } = useRobotState(wsUrl)
  const [demosRefresh, setDemosRefresh] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      <ConnectionStatus
        apiUrl={apiUrl}
        wsStatus={wsStatus}
        lastFrameAgo={lastFrameAgo}
        armConnected={state?.arm_connected ?? false}
        baseConnected={state?.base_connected ?? false}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <JointStatePanel joints={state?.joint_state} connected={state?.arm_connected ?? false} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CartesianPanel pose={state?.cartesian_state} />
            <NavPanel nav={state?.nav_state} />
          </div>
          <BasePanel base={state?.base_state} connected={state?.base_connected ?? false} />
        </div>

        <div className="flex flex-col gap-4">
          <RecordPanel api={api} onChange={() => setDemosRefresh((n) => n + 1)} />
          <DemosPanel api={api} refreshSignal={demosRefresh} />
        </div>
      </div>
    </div>
  )
}
