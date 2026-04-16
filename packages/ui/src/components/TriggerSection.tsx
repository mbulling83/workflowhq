import { TriggerInfo } from '../types'
import TriggerItem from './TriggerItem'
import { LayoutType } from './LayoutSelector'

interface TriggerSectionProps {
  title: string
  triggers: TriggerInfo[]
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  layout: LayoutType
  onPromptUpdate: (workflowId: string, nodeId: string, newPrompt: string) => Promise<void>
  n8nBaseUrl?: string
}

function TriggerSection({ triggers, type, layout, onPromptUpdate, n8nBaseUrl }: TriggerSectionProps) {
  if (triggers.length === 0) return null

  const groupedByWorkflow = triggers.reduce((acc, trigger) => {
    const workflowId = String(trigger.workflowId)
    if (!acc[workflowId]) acc[workflowId] = []
    acc[workflowId].push(trigger)
    return acc
  }, {} as Record<string, TriggerInfo[]>)

  const gridClass = layout === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
    : 'flex flex-col gap-3'

  return (
    <section>
      <div className={gridClass}>
        {Object.entries(groupedByWorkflow).map(([workflowId, workflowTriggers]) => (
          <TriggerItem
            key={workflowId}
            triggers={workflowTriggers}
            type={type}
            onPromptUpdate={onPromptUpdate}
            n8nBaseUrl={n8nBaseUrl}
          />
        ))}
      </div>
    </section>
  )
}

export default TriggerSection
