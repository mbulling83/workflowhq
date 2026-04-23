import type { TriggerInfo } from '../types'
import { useMemo, useState } from 'react'
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
  n8nBaseUrl?: string
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-2 text-sm text-slate-700 dark:text-slate-300 align-top', className)}>
      {children}
    </td>
  )
}

function TriggerTable({ groupedByWorkflow, type, selectedWorkflowId, onSelectWorkflow, n8nBaseUrl }: TriggerTableProps) {
  const workflows = useMemo(() => Object.entries(groupedByWorkflow), [groupedByWorkflow])
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const totalItems = workflows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedWorkflows = workflows.slice(startIndex, endIndex)

  const getN8NBaseUrl = (): string | null => {
    const configuredUrl =
      n8nBaseUrl ||
      localStorage.getItem('n8n_url') ||
      process.env.NEXT_PUBLIC_N8N_URL ||
      process.env.VITE_N8N_URL
    if (!configuredUrl) return null
    let baseUrl = configuredUrl
    baseUrl = baseUrl.replace(/\/api\/v1\/workflows\/?$/, '')
    const webhookMatch = baseUrl.match(/^(https?:\/\/[^/]+)/)
    if (webhookMatch) baseUrl = webhookMatch[1]
    return baseUrl
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems}
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="table-page-size">
            Rows
          </label>
          <select
            id="table-page-size"
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 outline-none"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {paginatedWorkflows.map(([workflowId, triggers]) => {
            const workflow = triggers[0]
            const cron = triggers[0]?.details
            const rowIsSelected = selectedWorkflowId === workflowId
            const baseUrl = getN8NBaseUrl()
            const workflowUrl = baseUrl ? `${baseUrl}/workflow/${workflow.workflowId}` : null
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
                <Cell className="font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{workflow.workflowName}</span>
                    {workflowUrl && (
                      <a
                        href={workflowUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        title="Open workflow in n8n"
                        aria-label="Open workflow in n8n"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 3H3.75C3.33579 3 3 3.33579 3 3.75V12.25C3 12.6642 3.33579 13 3.75 13H12.25C12.6642 13 13 12.6642 13 12.25V10"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 3H13M13 3V7M13 3L7 9"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </Cell>
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

      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-slate-200 dark:border-slate-800">
        <button
          className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={safeCurrentPage === 1}
        >
          Previous
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Page {safeCurrentPage} of {totalPages}
        </span>
        <button
          className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={safeCurrentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default TriggerTable
