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
type SortDirection = 'asc' | 'desc'
type SortKey =
  | 'workflowName'
  | 'active'
  | 'count'
  | 'frequency'
  | 'schedule'
  | 'timezone'
  | 'method'
  | 'path'
  | 'auth'
  | 'provider'
  | 'model'
  | 'tools'
  | 'triggerNodes'
  | 'triggerTypes'

interface TableRow {
  workflowId: string
  workflowName: string
  workflowUrl: string | null
  active: boolean
  count: number
  frequency: string
  schedule: string
  timezone: string
  method: string
  path: string
  auth: string
  provider: string
  model: string
  tools: number
  triggerNodes: string
  triggerTypes: string
}

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
  const [sortKey, setSortKey] = useState<SortKey>('workflowName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [primaryFilter, setPrimaryFilter] = useState<string>('all')
  const [secondaryFilter, setSecondaryFilter] = useState<string>('all')
  const [showFilterPanel, setShowFilterPanel] = useState(false)

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

  const baseUrl = getN8NBaseUrl()

  const rows = useMemo<TableRow[]>(() => {
    return workflows.map(([workflowId, triggers]) => {
      const workflow = triggers[0]
      const cron = triggers[0]?.details
      const aiProviders = Array.from(new Set(triggers.map((t) => t.details.provider).filter(Boolean))).join(', ') || 'Unknown'
      const aiModels = Array.from(new Set(triggers.map((t) => t.details.model).filter(Boolean))).join(', ') || 'Not specified'
      const aiToolCount = triggers.reduce((acc, t) => acc + (t.details.connectedTools?.length || 0), 0)
      const manualNodeNames = triggers.map((t) => t.nodeName).filter(Boolean).join(', ')
      const otherTypes = Array.from(
        new Set(triggers.map((t) => t.details.triggerType).filter(Boolean).map((t) => formatTriggerType(String(t))))
      ).join(', ')

      return {
        workflowId,
        workflowName: workflow.workflowName,
        workflowUrl: baseUrl ? `${baseUrl}/workflow/${workflow.workflowId}` : null,
        active: workflow.active,
        count: triggers.length,
        frequency: getCronFrequency(cron?.cronExpression),
        schedule: cron?.cronExpression || 'Not set',
        timezone: cron?.timezone || 'UTC',
        method: workflow.details.httpMethod || 'GET',
        path: workflow.details.webhookPath || 'default',
        auth: workflow.details.hasAuth ? 'Enabled' : 'None',
        provider: aiProviders,
        model: aiModels,
        tools: aiToolCount,
        triggerNodes: manualNodeNames || '-',
        triggerTypes: otherTypes || '-',
      }
    })
  }, [workflows, baseUrl])

  const primaryFilterOptions = useMemo(() => {
    if (type === 'cron') return Array.from(new Set(rows.map((r) => r.frequency))).sort()
    if (type === 'webhook') return Array.from(new Set(rows.map((r) => r.method))).sort()
    if (type === 'ai') return Array.from(new Set(rows.map((r) => r.provider))).sort()
    return []
  }, [rows, type])

  const secondaryFilterOptions = useMemo(() => {
    if (type === 'cron') return Array.from(new Set(rows.map((r) => r.timezone))).sort()
    if (type === 'webhook') return ['Enabled', 'None']
    if (type === 'ai') return Array.from(new Set(rows.map((r) => r.model))).sort()
    return []
  }, [rows, type])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter === 'active' && !row.active) return false
      if (statusFilter === 'inactive' && row.active) return false

      if (primaryFilter !== 'all') {
        if (type === 'cron' && row.frequency !== primaryFilter) return false
        if (type === 'webhook' && row.method !== primaryFilter) return false
        if (type === 'ai' && row.provider !== primaryFilter) return false
      }

      if (secondaryFilter !== 'all') {
        if (type === 'cron' && row.timezone !== secondaryFilter) return false
        if (type === 'webhook' && row.auth !== secondaryFilter) return false
        if (type === 'ai' && row.model !== secondaryFilter) return false
      }

      return true
    })
  }, [rows, statusFilter, primaryFilter, secondaryFilter, type])

  const sortedRows = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1
    const valueFor = (row: TableRow): string | number | boolean => row[sortKey]

    return [...filteredRows].sort((a, b) => {
      const av = valueFor(a)
      const bv = valueFor(b)

      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction
      if (typeof av === 'boolean' && typeof bv === 'boolean') return ((av ? 1 : 0) - (bv ? 1 : 0)) * direction
      return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * direction
    })
  }, [filteredRows, sortKey, sortDirection])

  const totalItems = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedRows = sortedRows.slice(startIndex, endIndex)

  const toggleSort = (key: SortKey) => {
    setCurrentPage(1)
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const activeFilterCount = [
    statusFilter !== 'all',
    primaryFilter !== 'all',
    secondaryFilter !== 'all',
  ].filter(Boolean).length

  return (
    <div className="relative rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setShowFilterPanel((open) => !open)}
            title="Filters"
            aria-label="Open filters"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 3H14L9.5 8V12.5L6.5 14V8L2 3Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex min-w-[14px] h-[14px] items-center justify-center rounded-full bg-slate-900 text-[9px] text-white dark:bg-slate-100 dark:text-slate-900">
                {activeFilterCount}
              </span>
            )}
          </button>
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

      {showFilterPanel && (
        <div className="absolute right-3 top-11 z-20 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Filters</p>
            <button
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 underline underline-offset-2"
              onClick={() => setShowFilterPanel(false)}
            >
              Close
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 dark:text-slate-400">Status</label>
            <select
              className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                setCurrentPage(1)
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {(type === 'cron' || type === 'webhook' || type === 'ai') && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 dark:text-slate-400">
                  {type === 'cron' ? 'Frequency' : type === 'webhook' ? 'Method' : 'Provider'}
                </label>
                <select
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                  value={primaryFilter}
                  onChange={(e) => {
                    setPrimaryFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">All</option>
                  {primaryFilterOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 dark:text-slate-400">
                  {type === 'cron' ? 'Timezone' : type === 'webhook' ? 'Auth' : 'Model'}
                </label>
                <select
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                  value={secondaryFilter}
                  onChange={(e) => {
                    setSecondaryFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">All</option>
                  {secondaryFilterOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="pt-1">
            <button
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => {
                setStatusFilter('all')
                setPrimaryFilter('all')
                setSecondaryFilter('all')
                setCurrentPage(1)
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr className="text-left">
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('workflowName')}>Workflow <span>{sortIndicator('workflowName')}</span></button>
              </th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('active')}>Status <span>{sortIndicator('active')}</span></button>
              </th>
              {type === 'cron' && (
                <>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('frequency')}>Frequency <span>{sortIndicator('frequency')}</span></button>
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('schedule')}>Schedule <span>{sortIndicator('schedule')}</span></button>
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('timezone')}>Timezone <span>{sortIndicator('timezone')}</span></button>
                  </th>
                </>
              )}
              {type === 'webhook' && (
                <>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('method')}>Method <span>{sortIndicator('method')}</span></button>
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('path')}>Path <span>{sortIndicator('path')}</span></button>
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('auth')}>Auth <span>{sortIndicator('auth')}</span></button>
                  </th>
                </>
              )}
              {type === 'ai' && (
                <>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('provider')}>Provider <span>{sortIndicator('provider')}</span></button>
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('model')}>Model <span>{sortIndicator('model')}</span></button>
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('tools')}>Tools <span>{sortIndicator('tools')}</span></button>
                  </th>
                </>
              )}
              {type === 'manual' && (
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <button className="inline-flex items-center gap-1" onClick={() => toggleSort('triggerNodes')}>Trigger Nodes <span>{sortIndicator('triggerNodes')}</span></button>
                </th>
              )}
              {type === 'other' && (
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <button className="inline-flex items-center gap-1" onClick={() => toggleSort('triggerTypes')}>Trigger Types <span>{sortIndicator('triggerTypes')}</span></button>
                </th>
              )}
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('count')}>Count <span>{sortIndicator('count')}</span></button>
              </th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => {
            const rowIsSelected = selectedWorkflowId === row.workflowId
            return (
              <tr
                key={row.workflowId}
                className={cn(
                  'border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
                  rowIsSelected && 'bg-slate-100/80 dark:bg-slate-800/70'
                )}
              >
                <Cell className="font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{row.workflowName}</span>
                    {row.workflowUrl && (
                      <a
                        href={row.workflowUrl}
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
                  <Badge variant={row.active ? 'success' : 'secondary'}>
                    {row.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Cell>

                {type === 'cron' && (
                  <>
                    <Cell>{row.frequency}</Cell>
                    <Cell>
                      <code className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {row.schedule}
                      </code>
                    </Cell>
                    <Cell>{row.timezone}</Cell>
                  </>
                )}

                {type === 'webhook' && (
                  <>
                    <Cell>{row.method}</Cell>
                    <Cell>{row.path}</Cell>
                    <Cell>{row.auth}</Cell>
                  </>
                )}

                {type === 'ai' && (
                  <>
                    <Cell>{row.provider}</Cell>
                    <Cell>{row.model}</Cell>
                    <Cell>{row.tools}</Cell>
                  </>
                )}

                {type === 'manual' && <Cell>{row.triggerNodes}</Cell>}
                {type === 'other' && <Cell>{row.triggerTypes}</Cell>}

                <Cell>{row.count}</Cell>
                <Cell>
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-300 transition-colors"
                    onClick={() => onSelectWorkflow(row.workflowId)}
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
