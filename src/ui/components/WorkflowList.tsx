import { useMemo, useState, useCallback, useEffect } from 'react'
import type { Workflow, TriggerInfo } from '../types'
import { parseWorkflows } from '../utils/workflowParser'
import { filterTriggers } from '../utils/filterTriggers'
import { sortTriggers } from '../utils/sortTriggers'
import { getTriggerTypeCategory } from '../utils/formatTriggerType'
import TriggerSection from './TriggerSection'
import FilterBar, { type FilterState } from './FilterBar'
import SortBar, { type SortState } from './SortBar'
import SearchBar from './SearchBar'
import LayoutSelector, { type LayoutType } from './LayoutSelector'
import Tabs from './Tabs'
import CronCalendar from './CronCalendar'
import WorkflowDetailsSidebar from './WorkflowDetailsSidebar'

interface WorkflowListProps {
  workflows: Workflow[]
  onWorkflowUpdate: () => void
  updateWorkflow: (workflowId: string, data: Partial<Workflow>) => Promise<Workflow>
  n8nBaseUrl?: string
}

function WorkflowList({ workflows, onWorkflowUpdate, updateWorkflow, n8nBaseUrl }: WorkflowListProps) {
  const [filters, setFilters] = useState<FilterState>({ active: 'active' })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchQueryPerTab, setSearchQueryPerTab] = useState<Record<string, string>>({})
  const [sortState, setSortState] = useState<SortState>({
    sortBy: 'alphabetical',
    sortOrder: 'asc',
  })
  const [layout, setLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem('workflow-layout')
    if (saved === 'masonry' || (saved !== 'list' && saved !== 'grid' && saved !== 'table')) {
      return 'list'
    }
    return (saved as LayoutType) || 'list'
  })
  const [selectedWorkflowByTab, setSelectedWorkflowByTab] = useState<Record<string, string | undefined>>({})

  const [cronView, setCronView] = useState<'list' | 'calendar'>(() => {
    const saved = localStorage.getItem('cron-view')
    return (saved as 'list' | 'calendar') || 'list'
  })

  // Save layout preference to localStorage
  useEffect(() => {
    localStorage.setItem('workflow-layout', layout)
  }, [layout])

  // Save cron view preference to localStorage
  useEffect(() => {
    localStorage.setItem('cron-view', cronView)
  }, [cronView])

  const triggers = useMemo(() => parseWorkflows(workflows), [workflows])

  const groupedTriggers = useMemo(() => {
    const groups: Record<string, TriggerInfo[]> = {
      cron: [],
      webhook: [],
      ai: [],
      manual: [],
      other: [],
    }

    triggers.forEach((trigger) => {
      if (trigger.type === 'tool') return // Tools are shown on agents page as pills, no standalone tab
      groups[trigger.type].push(trigger)
    })

    return groups
  }, [triggers])

  // Apply filters, search, and sorting to each group
  const filteredGroups = useMemo(() => {
    const applyFiltersAndSearch = (triggers: TriggerInfo[], query: string) => {
      let filtered = filterTriggers(triggers, filters)
      
      // Apply search query
      if (query.trim()) {
        const lowerQuery = query.toLowerCase()
        filtered = filtered.filter(trigger => {
          // Search in workflow name
          if (trigger.workflowName.toLowerCase().includes(lowerQuery)) return true
          
          // Search in details based on trigger type
          const details = trigger.details
          
          // Search in common fields
          if (details.description?.toLowerCase().includes(lowerQuery)) return true
          if (details.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true
          
          // Type-specific searches
          if (details.cronExpression?.toLowerCase().includes(lowerQuery)) return true
          if (details.webhookPath?.toLowerCase().includes(lowerQuery)) return true
          if (details.httpMethod?.toLowerCase().includes(lowerQuery)) return true
          if (details.model?.toLowerCase().includes(lowerQuery)) return true
          if (details.provider?.toLowerCase().includes(lowerQuery)) return true
          if (details.agentName?.toLowerCase().includes(lowerQuery)) return true
          if (details.prompt?.toLowerCase().includes(lowerQuery)) return true
          if (details.connectedTools?.some(
            (t) =>
              t.toolType?.toLowerCase().includes(lowerQuery) ||
              t.toolName?.toLowerCase().includes(lowerQuery) ||
              t.toolDescription?.toLowerCase().includes(lowerQuery)
          ))
            return true
          if (details.toolType?.toLowerCase().includes(lowerQuery)) return true
          if (details.toolName?.toLowerCase().includes(lowerQuery)) return true
          if (details.toolDescription?.toLowerCase().includes(lowerQuery)) return true
          
          // Search in trigger type (for 'other' triggers)
          if (details.triggerType) {
            const formattedType = getTriggerTypeCategory(details.triggerType)
            if (formattedType.toLowerCase().includes(lowerQuery)) return true
          }
          
          return false
        })
      }
      
      // Apply sorting
      return sortTriggers(filtered, sortState.sortBy, sortState.sortOrder)
    }

    return {
      cron: applyFiltersAndSearch(groupedTriggers.cron, searchQueryPerTab['cron'] || ''),
      webhook: applyFiltersAndSearch(groupedTriggers.webhook, searchQueryPerTab['webhook'] || ''),
      ai: applyFiltersAndSearch(groupedTriggers.ai, searchQueryPerTab['ai'] || ''),
      manual: applyFiltersAndSearch(groupedTriggers.manual, searchQueryPerTab['manual'] || ''),
      other: applyFiltersAndSearch(groupedTriggers.other, searchQueryPerTab['other'] || ''),
    }
  }, [groupedTriggers, filters, searchQueryPerTab, sortState])

  const tabs = [
    { id: 'cron', label: 'Cron', count: filteredGroups.cron.length },
    { id: 'webhook', label: 'Webhooks', count: filteredGroups.webhook.length },
    { id: 'ai', label: 'AI Agents', count: filteredGroups.ai.length },
    { id: 'manual', label: 'Manual', count: filteredGroups.manual.length },
    ...(groupedTriggers.other.length > 0 
      ? [{ id: 'other', label: 'Other', count: filteredGroups.other.length }]
      : [])
  ]

  // Reset filters when switching tabs
  const handleTabChange = (tabId: string) => {
    setFilters({})
    // Load the search query for this tab
    setSearchQuery(searchQueryPerTab[tabId] || '')
  }

  // Get suggestions for type-ahead based on current tab
  const getSuggestions = useCallback((tabId: string): string[] => {
    const triggers = groupedTriggers[tabId as keyof typeof groupedTriggers] || []
    const suggestions = new Set<string>()
    
    triggers.forEach(trigger => {
      // Add workflow name
      suggestions.add(trigger.workflowName)
      
      // Add type-specific suggestions
      const details = trigger.details
      if (details.tags) details.tags.forEach(tag => suggestions.add(tag))
      if (details.provider) suggestions.add(details.provider)
      if (details.model) suggestions.add(details.model)
      if (details.agentName) suggestions.add(details.agentName)
      details.connectedTools?.forEach((t) => {
        if (t.toolType) suggestions.add(t.toolType)
        if (t.toolName) suggestions.add(t.toolName)
      })
      if (details.toolType) suggestions.add(details.toolType)
      if (details.toolName) suggestions.add(details.toolName)
      if (details.httpMethod) suggestions.add(details.httpMethod)
      
      // Add trigger type for 'other' tab
      if (tabId === 'other' && details.triggerType) {
        suggestions.add(getTriggerTypeCategory(details.triggerType))
      }
    })
    
    return Array.from(suggestions).sort()
  }, [groupedTriggers])

  // Handle search query change
  const handleSearchChange = (tabId: string, query: string) => {
    setSearchQuery(query)
    setSearchQueryPerTab(prev => ({ ...prev, [tabId]: query }))
  }

  // Handle prompt update
  const handlePromptUpdate = useCallback(async (workflowId: string, nodeId: string, newPrompt: string) => {
    // Find the workflow
    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) {
      throw new Error('Workflow not found')
    }

    // Find the node
    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error('Node not found')
    }

    // Update the prompt in the node parameters
    // The prompt can be in different locations depending on the node type
    const updatedNodes = workflow.nodes.map(n => {
      if (n.id === nodeId) {
        const updatedNode = { ...n }
        
        // Try to update prompt in various possible locations
        if (updatedNode.parameters.text !== undefined) {
          updatedNode.parameters = { ...updatedNode.parameters, text: newPrompt }
        } else if (updatedNode.parameters.prompt !== undefined) {
          updatedNode.parameters = { ...updatedNode.parameters, prompt: newPrompt }
        } else if (updatedNode.parameters.systemMessage !== undefined) {
          updatedNode.parameters = { ...updatedNode.parameters, systemMessage: newPrompt }
        } else if (updatedNode.parameters.instructions !== undefined) {
          updatedNode.parameters = { ...updatedNode.parameters, instructions: newPrompt }
        } else if (updatedNode.parameters.options?.systemMessage !== undefined) {
          updatedNode.parameters = {
            ...updatedNode.parameters,
            options: {
              ...updatedNode.parameters.options,
              systemMessage: newPrompt
            }
          }
        } else {
          // Default: add as 'text' parameter
          updatedNode.parameters = { ...updatedNode.parameters, text: newPrompt }
        }
        
        return updatedNode
      }
      return n
    })

    // Update the workflow via API
    await updateWorkflow(workflowId, {
      nodes: updatedNodes
    })

    // Refresh workflows
    onWorkflowUpdate()
  }, [workflows, onWorkflowUpdate, updateWorkflow])

  return (
    <Tabs
      tabs={tabs}
      onTabChange={handleTabChange}
      headerActions={(activeTab) => (
        activeTab === 'cron' ? (
          <div className="layout-selector">
            <button
              className={`layout-button ${cronView === 'list' ? 'active' : ''}`}
              onClick={() => setCronView('list')}
              title="List view"
              aria-label="List view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="12" height="2" rx="0.5" fill="currentColor" />
                <rect x="2" y="7" width="12" height="2" rx="0.5" fill="currentColor" />
                <rect x="2" y="12" width="12" height="2" rx="0.5" fill="currentColor" />
              </svg>
            </button>
            <button
              className={`layout-button ${cronView === 'calendar' ? 'active' : ''}`}
              onClick={() => setCronView('calendar')}
              title="Calendar view"
              aria-label="Calendar view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.25" />
                <path d="M2 6.5H14M5 1.75V4.25M11 1.75V4.25" stroke="currentColor" strokeWidth="1.25" />
              </svg>
            </button>
          </div>
        ) : (
          <LayoutSelector layout={layout} onChange={setLayout} />
        )
      )}
    >
      {(currentTab) => {
        const currentTriggers = filteredGroups[currentTab as keyof typeof filteredGroups] || []
        const suggestions = getSuggestions(currentTab)
        const selectedWorkflowId = selectedWorkflowByTab[currentTab]
        const selectedWorkflowTriggers =
          selectedWorkflowId
            ? currentTriggers.filter((trigger) => trigger.workflowId === selectedWorkflowId)
            : null
        const handleSelectWorkflow = (workflowId: string) => {
          setSelectedWorkflowByTab((prev) => ({ ...prev, [currentTab]: workflowId }))
        }
        const handleCloseSidebar = () => {
          setSelectedWorkflowByTab((prev) => ({ ...prev, [currentTab]: undefined }))
        }
        
        // Check if any triggers in the unfiltered group have executed data
        const unfilteredTriggers = groupedTriggers[currentTab as keyof typeof groupedTriggers] || []
        const hasExecutedData = unfilteredTriggers.some(trigger => trigger.lastExecuted != null)
        
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <SearchBar
                value={searchQuery}
                onChange={(query) => handleSearchChange(currentTab, query)}
                placeholder={`Search ${currentTab === 'ai' ? 'agents' : currentTab === 'manual' ? 'manual triggers' : `${currentTab} triggers`}...`}
                suggestions={suggestions}
              />
              <FilterBar
                triggers={unfilteredTriggers}
                type={currentTab as 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'}
                filters={filters}
                onFilterChange={setFilters}
              />
              <SortBar
                sortState={sortState}
                onSortChange={setSortState}
                hasExecutedData={hasExecutedData}
              />
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                {currentTab === 'cron' && (
                  cronView === 'calendar' ? (
                    <CronCalendar triggers={filteredGroups.cron} />
                  ) : (
                    <TriggerSection
                      title="Cron Triggers"
                      triggers={filteredGroups.cron}
                      type="cron"
                      layout={layout}
                      onPromptUpdate={handlePromptUpdate}
                      n8nBaseUrl={n8nBaseUrl}
                      selectedWorkflowId={selectedWorkflowId}
                      onSelectWorkflow={handleSelectWorkflow}
                    />
                  )
                )}
                {currentTab === 'webhook' && (
                  <TriggerSection
                    title="Webhook Triggers"
                    triggers={filteredGroups.webhook}
                    type="webhook"
                    layout={layout}
                    onPromptUpdate={handlePromptUpdate}
                    n8nBaseUrl={n8nBaseUrl}
                    selectedWorkflowId={selectedWorkflowId}
                    onSelectWorkflow={handleSelectWorkflow}
                  />
                )}
                {currentTab === 'ai' && (
                  <TriggerSection
                    title="AI Agents"
                    triggers={filteredGroups.ai}
                    type="ai"
                    layout={layout}
                    onPromptUpdate={handlePromptUpdate}
                    n8nBaseUrl={n8nBaseUrl}
                    selectedWorkflowId={selectedWorkflowId}
                    onSelectWorkflow={handleSelectWorkflow}
                  />
                )}
                {currentTab === 'manual' && (
                  <TriggerSection
                    title="Manual Triggers"
                    triggers={filteredGroups.manual}
                    type="manual"
                    layout={layout}
                    onPromptUpdate={handlePromptUpdate}
                    n8nBaseUrl={n8nBaseUrl}
                    selectedWorkflowId={selectedWorkflowId}
                    onSelectWorkflow={handleSelectWorkflow}
                  />
                )}
                {currentTab === 'other' && filteredGroups.other.length > 0 && (
                  <TriggerSection
                    title="Other Triggers"
                    triggers={filteredGroups.other}
                    type="other"
                    layout={layout}
                    onPromptUpdate={handlePromptUpdate}
                    n8nBaseUrl={n8nBaseUrl}
                    selectedWorkflowId={selectedWorkflowId}
                    onSelectWorkflow={handleSelectWorkflow}
                  />
                )}
              </div>
              {(currentTab !== 'cron' || cronView !== 'calendar') && layout === 'table' ? (
                <WorkflowDetailsSidebar
                  workflowTriggers={selectedWorkflowTriggers && selectedWorkflowTriggers.length > 0 ? selectedWorkflowTriggers : null}
                  type={currentTab as 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'}
                  onPromptUpdate={handlePromptUpdate}
                  onClose={handleCloseSidebar}
                  n8nBaseUrl={n8nBaseUrl}
                />
              ) : null}
            </div>
            {currentTriggers.length === 0 && (() => {
              const hasActiveFilters = Object.keys(filters).some(k => filters[k as keyof FilterState] !== undefined)
              const hasSearch = (searchQueryPerTab[currentTab] || '').trim().length > 0
              const isFiltered = hasActiveFilters || hasSearch
              const genuinelyEmpty = (groupedTriggers[currentTab as keyof typeof groupedTriggers] || []).length === 0

              if (genuinelyEmpty) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <span className="text-sm">All quiet here.</span>
                  </div>
                )
              }
              return (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <span className="text-sm">
                    {isFiltered
                      ? 'Nothing matching. Your filters might be too strict.'
                      : 'No workflows found.'}
                  </span>
                  {isFiltered && (
                    <button
                      className="text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      onClick={() => {
                        setFilters({})
                        handleSearchChange(currentTab, '')
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        )
      }}
    </Tabs>
  )
}

export default WorkflowList
