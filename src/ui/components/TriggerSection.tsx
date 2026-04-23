import type { TriggerInfo } from '../types'
import TriggerItem from './TriggerItem'
import TriggerTable from './TriggerTable'
import type { LayoutType } from './LayoutSelector'

interface TriggerSectionProps {
  title: string
  triggers: TriggerInfo[]
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  layout: LayoutType
  onPromptUpdate: (workflowId: string, nodeId: string, newPrompt: string) => Promise<void>
  n8nBaseUrl?: string
  selectedWorkflowId?: string
  onSelectWorkflow: (workflowId: string) => void
}

function TriggerSection({
  triggers,
  type,
  layout,
  onPromptUpdate,
  n8nBaseUrl,
  selectedWorkflowId,
  onSelectWorkflow,
}: TriggerSectionProps) {
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

  if (layout === 'table') {
    return (
      <section>
        <TriggerTable
          groupedByWorkflow={groupedByWorkflow}
          type={type}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={onSelectWorkflow}
        />
      </section>
    )
  }

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
            isSelected={selectedWorkflowId === workflowId}
            onSelectWorkflow={onSelectWorkflow}
          />
        ))}
      </div>
    </section>
  )
}

export default TriggerSection
