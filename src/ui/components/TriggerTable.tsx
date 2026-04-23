import type { TriggerInfo } from '../types'
import type { ReactNode } from 'react'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import { getCronFrequency } from '../utils/cronFrequency'
import { formatTriggerType } from '../utils/formatTriggerType'

interface TriggerTableProps {
  groupedByWorkflow: Record<string, TriggerInfo[]>
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  selectedWorkflowId?: string
  onSelectWorkflow: (workflowId: string) => void
}

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-2 text-sm text-slate-700 dark:text-slate-300 align-top', className)}>
      {children}
    </td>
  )
}

function TriggerTable({ groupedByWorkflow, type, selectedWorkflowId, onSelectWorkflow }: TriggerTableProps) {
  const workflows = Object.entries(groupedByWorkflow)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <table className="w-full min-w-[820px] border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr className="text-left">
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Workflow</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
            {type === 'cron' && (
              <>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Frequency</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Schedule</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Timezone</th>
              </>
            )}
            {type === 'webhook' && (
              <>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Method</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Path</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Auth</th>
              </>
            )}
            {type === 'ai' && (
              <>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Provider</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Model</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tools</th>
              </>
            )}
            {type === 'manual' && (
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trigger Nodes</th>
            )}
            {type === 'other' && (
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trigger Types</th>
            )}
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Count</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"></th>
          </tr>
        </thead>
        <tbody>
          {workflows.map(([workflowId, triggers]) => {
            const workflow = triggers[0]
            const cron = triggers[0]?.details
            const rowIsSelected = selectedWorkflowId === workflowId
            const aiProviders = Array.from(new Set(triggers.map((t) => t.details.provider).filter(Boolean))).join(', ') || 'Unknown'
            const aiModels = Array.from(new Set(triggers.map((t) => t.details.model).filter(Boolean))).join(', ') || 'Not specified'
            const aiToolCount = triggers.reduce((acc, t) => acc + (t.details.connectedTools?.length || 0), 0)
            const manualNodeNames = triggers.map((t) => t.nodeName).filter(Boolean).join(', ')
            const otherTypes = Array.from(
              new Set(triggers.map((t) => t.details.triggerType).filter(Boolean).map((t) => formatTriggerType(String(t))))
            ).join(', ')

            return (
              <tr
                key={workflowId}
                className={cn(
                  'border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
                  rowIsSelected && 'bg-slate-100/80 dark:bg-slate-800/70'
                )}
              >
                <Cell className="font-medium text-slate-900 dark:text-slate-100">{workflow.workflowName}</Cell>
                <Cell>
                  <Badge variant={workflow.active ? 'success' : 'secondary'}>
                    {workflow.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Cell>

                {type === 'cron' && (
                  <>
                    <Cell>{getCronFrequency(cron.cronExpression)}</Cell>
                    <Cell>
                      <code className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {cron.cronExpression || 'Not set'}
                      </code>
                    </Cell>
                    <Cell>{cron.timezone || 'UTC'}</Cell>
                  </>
                )}

                {type === 'webhook' && (
                  <>
                    <Cell>{workflow.details.httpMethod || 'GET'}</Cell>
                    <Cell>{workflow.details.webhookPath || 'default'}</Cell>
                    <Cell>{workflow.details.hasAuth ? 'Enabled' : 'None'}</Cell>
                  </>
                )}

                {type === 'ai' && (
                  <>
                    <Cell>{aiProviders}</Cell>
                    <Cell>{aiModels}</Cell>
                    <Cell>{aiToolCount}</Cell>
                  </>
                )}

                {type === 'manual' && <Cell>{manualNodeNames || '-'}</Cell>}
                {type === 'other' && <Cell>{otherTypes || '-'}</Cell>}

                <Cell>{triggers.length}</Cell>
                <Cell>
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-300 transition-colors"
                    onClick={() => onSelectWorkflow(workflowId)}
                    title="More info"
                    aria-label="More info"
                  >
                    <span className="text-[11px] font-semibold leading-none">i</span>
                  </button>
                </Cell>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TriggerTable
