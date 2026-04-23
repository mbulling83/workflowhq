import type { TriggerInfo } from '../types'
import TriggerItem from './TriggerItem'
import { cn } from '../lib/utils'

interface WorkflowDetailsSidebarProps {
  workflowTriggers: TriggerInfo[] | null
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  onPromptUpdate: (workflowId: string, nodeId: string, newPrompt: string) => Promise<void>
  onClose: () => void
  n8nBaseUrl?: string
}

function WorkflowDetailsSidebar({
  workflowTriggers,
  type,
  onPromptUpdate,
  onClose,
  n8nBaseUrl,
}: WorkflowDetailsSidebarProps) {
  return (
    <aside
      className={cn(
        'w-0 overflow-hidden transition-all duration-200 ease-out',
        workflowTriggers && 'w-full max-w-[420px]'
      )}
    >
      {workflowTriggers && (
        <div className="h-full border-l border-slate-200 dark:border-slate-800 pl-4">
          <div className="sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 mb-2 z-10 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Workflow Details
            </p>
            <button
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 underline underline-offset-2"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <TriggerItem
            triggers={workflowTriggers}
            type={type}
            onPromptUpdate={onPromptUpdate}
            n8nBaseUrl={n8nBaseUrl}
            showDetailsButton={false}
          />
        </div>
      )}
    </aside>
  )
}

export default WorkflowDetailsSidebar
