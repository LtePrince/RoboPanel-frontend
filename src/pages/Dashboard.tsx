import { RealDashboard } from './RealDashboard'
import { Sim } from './Sim'
import { useSettings } from '../context/SettingsContext'

/** The 监控 page; content depends on the active 真机/仿真 mode. */
export function Dashboard() {
  const { mode } = useSettings()
  return mode === 'real' ? <RealDashboard /> : <Sim />
}
