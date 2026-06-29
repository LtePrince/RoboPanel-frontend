import { useState } from 'react'
import { Activity, Film } from 'lucide-react'
import { cn } from '../lib/cn'
import { SimLive } from './SimLive'
import { SimView } from './SimView'

type Tab = 'live' | 'replay'

export function Sim() {
  const [tab, setTab] = useState<Tab>('live')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit rounded-lg border border-border bg-panel p-0.5">
        {([['live', '实时仿真', Activity], ['replay', '评估回放', Film]] as const).map(
          ([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
                tab === id ? 'bg-accent text-bg' : 'text-text hover:text-text-strong',
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ),
        )}
      </div>
      {tab === 'live' ? <SimLive /> : <SimView />}
    </div>
  )
}
