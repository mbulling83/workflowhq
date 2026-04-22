import type { TriggerInfo } from '../types'
import { getTriggerTypeCategory } from '../utils/formatTriggerType'
import { cn } from '../lib/utils'

// Positive whitelist: values that are definitely model IDs
const KNOWN_MODEL_PATTERN = /^(gpt[-/]|claude[-/]|gemini[-/]|llama[-/]|mistral|mistralai\/|qwen[-/]|deepseek|mixtral|command[-/r]|sonar|text-embedding|embedding-|phi[-/]|o[1-9][-/]|anthropic\/|google\/|openai\/|glm-)/i

function normalizeValue(value: string): string {
  return value.trim().toLowerCase()
}

function isKnownModel(value: string): boolean {
  return KNOWN_MODEL_PATTERN.test(value.trim())
}

function isLikelyToolIdentifier(value: string): boolean {
  const cleaned = value.trim()
  if (!cleaned) return false
  // Anything that looks like a snake_case function name or CamelCase workflow name
  // is almost certainly a tool, not a model
  if (/_tool$|_fn$|Workflow$/.test(cleaned)) return true
  if (/^[A-Z][a-z]+[A-Z]/.test(cleaned)) return true  // CamelCase like FlightSearch
  if (/^[a-z]+[A-Z]/.test(cleaned)) return true        // camelCase like addWorkflow
  const TOOL_IDENTIFIER_PATTERN = /\b(tool|http|request|calendar|function|vector|database|sql|scrape|api)\b/i
  return TOOL_IDENTIFIER_PATTERN.test(cleaned)
}

function toSortedUniqueValues(values: string[]): string[] {
  const byNormalized = new Map<string, string>()
  values.forEach((value) => {
    const cleaned = value.trim()
    if (!cleaned) return
    const normalized = normalizeValue(cleaned)
    if (!byNormalized.has(normalized)) {
      byNormalized.set(normalized, cleaned)
    }
  })
  return Array.from(byNormalized.values()).sort((a, b) => a.localeCompare(b))
}

export interface FilterState {
  active?: 'all' | 'active' | 'inactive'
  timezone?: string
  httpMethod?: string // Keep for backward compatibility, but prefer httpMethods
  httpMethods?: string[] // Array of selected HTTP methods
  hasAuth?: 'all' | 'yes' | 'no'
  provider?: string
  model?: string
  toolType?: string
  triggerType?: string
}

interface FilterBarProps {
  triggers: TriggerInfo[]
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

const selectClass = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors'
const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400'

function FilterBar({ triggers, type, filters, onFilterChange }: FilterBarProps) {
  // Get unique values for filter options
  // Ensure all values are strings to avoid React key/rendering issues
  const uniqueTimezones = Array.from(
    new Set(triggers.map(t => String(t.details.timezone || '')).filter(Boolean))
  ).sort()

  // Extract individual HTTP methods from comma-separated strings
  const uniqueHttpMethods = Array.from(
    new Set(
      triggers
        .flatMap(t => {
          const methodStr = String(t.details.httpMethod || '')
          if (!methodStr) return []
          // Split by comma and trim each method
          return methodStr.split(',').map(m => m.trim()).filter(Boolean)
        })
    )
  ).sort()

  const uniqueProviders = Array.from(
    new Set(triggers.map(t => String(t.details.provider || '')).filter(Boolean))
  ).sort()

  // Keep AI models and tool-like identifiers in separate dropdowns.
  const modelCandidates: string[] = []
  const toolCandidates: string[] = []
  const knownToolIdentifiers = new Set<string>()

  if (type === 'ai') {
    triggers.forEach((t) => {
      if (t.details.connectedTools) {
        t.details.connectedTools.forEach((ct) => {
          if (ct.toolType) {
            toolCandidates.push(ct.toolType)
            knownToolIdentifiers.add(normalizeValue(ct.toolType))
          }
          if (ct.toolName) {
            toolCandidates.push(ct.toolName)
            knownToolIdentifiers.add(normalizeValue(ct.toolName))
          }
        })
      }

      if (t.details.toolType) {
        toolCandidates.push(String(t.details.toolType))
        knownToolIdentifiers.add(normalizeValue(String(t.details.toolType)))
      }

      const modelValue = String(t.details.model || '').trim()
      if (!modelValue || modelValue === 'Not specified' || modelValue === 'Unknown') {
        return
      }

      if (knownToolIdentifiers.has(normalizeValue(modelValue))) {
        toolCandidates.push(modelValue)
      } else if (isKnownModel(modelValue)) {
        modelCandidates.push(modelValue)
      } else if (isLikelyToolIdentifier(modelValue)) {
        toolCandidates.push(modelValue)
      }
      // else: unrecognised value — silently drop (don't pollute either dropdown)
    })
  }

  const uniqueModels = toSortedUniqueValues(modelCandidates)
  const uniqueToolTypes = toSortedUniqueValues(toolCandidates)

  const uniqueTriggerTypes = Array.from(
    new Set(triggers.map(t => getTriggerTypeCategory(String(t.details.triggerType || ''))).filter(Boolean))
  ).sort()

  const updateFilter = (key: keyof FilterState, value: string | undefined) => {
    onFilterChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <label className={labelClass}>Status:</label>
        <select
          className={selectClass}
          value={filters.active || 'all'}
          onChange={(e) => updateFilter('active', e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {type === 'cron' && uniqueTimezones.length > 0 && (
        <div className="flex items-center gap-1.5">
          <label className={labelClass}>Timezone:</label>
          <select
            className={selectClass}
            value={filters.timezone || 'all'}
            onChange={(e) => updateFilter('timezone', e.target.value)}
          >
            <option value="all">All</option>
            {uniqueTimezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      )}

      {type === 'webhook' && (
        <>
          {uniqueHttpMethods.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className={labelClass}>Method:</label>
              <div className="flex items-center gap-1.5">
                {uniqueHttpMethods.map(method => {
                  const isChecked = filters.httpMethods?.includes(method) || false
                  return (
                    <label key={method} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-600 accent-slate-900 dark:accent-slate-100"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentMethods = filters.httpMethods || []
                          const newMethods = e.target.checked
                            ? [...currentMethods, method]
                            : currentMethods.filter(m => m !== method)
                          onFilterChange({
                            ...filters,
                            httpMethods: newMethods.length > 0 ? newMethods : undefined,
                            httpMethod: undefined,
                          })
                        }}
                      />
                      <span className={cn(labelClass, 'cursor-pointer')}>{method}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <label className={labelClass}>Auth:</label>
            <select
              className={selectClass}
              value={filters.hasAuth || 'all'}
              onChange={(e) => updateFilter('hasAuth', e.target.value)}
            >
              <option value="all">All</option>
              <option value="yes">With Auth</option>
              <option value="no">No Auth</option>
            </select>
          </div>
        </>
      )}

      {type === 'ai' && (
        <>
          {uniqueProviders.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className={labelClass}>Provider:</label>
              <select
                className={selectClass}
                value={filters.provider || 'all'}
                onChange={(e) => updateFilter('provider', e.target.value)}
              >
                <option value="all">All</option>
                {uniqueProviders.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
          )}
          {uniqueModels.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className={labelClass}>Model:</label>
              <select
                className={selectClass}
                value={filters.model || 'all'}
                onChange={(e) => updateFilter('model', e.target.value)}
              >
                <option value="all">All</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          )}
          {uniqueToolTypes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className={labelClass}>Uses tool:</label>
              <select
                className={selectClass}
                value={filters.toolType || 'all'}
                onChange={(e) => updateFilter('toolType', e.target.value)}
              >
                <option value="all">All</option>
                {uniqueToolTypes.map(toolType => (
                  <option key={toolType} value={toolType}>{toolType}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {type === 'other' && (
        <>
          {uniqueTriggerTypes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className={labelClass}>Trigger Type:</label>
              <select
                className={selectClass}
                value={filters.triggerType || 'all'}
                onChange={(e) => updateFilter('triggerType', e.target.value)}
              >
                <option value="all">All</option>
                {uniqueTriggerTypes.map(triggerType => (
                  <option key={triggerType} value={triggerType}>{triggerType}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FilterBar
