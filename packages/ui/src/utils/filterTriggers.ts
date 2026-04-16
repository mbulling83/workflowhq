import { TriggerInfo } from '../types'
import { FilterState } from '../components/FilterBar'
import { getTriggerTypeCategory } from './formatTriggerType'

export function filterTriggers(triggers: TriggerInfo[], filters: FilterState): TriggerInfo[] {
  return triggers.filter(trigger => {
    // Filter by active status
    if (filters.active !== undefined) {
      if (filters.active === 'active' && !trigger.active) return false
      if (filters.active === 'inactive' && trigger.active) return false
    }

    // Filter by timezone (for cron)
    if (filters.timezone && trigger.details.timezone !== filters.timezone) {
      return false
    }

    // Filter by HTTP method(s) (for webhooks)
    // Support both old single method filter and new array filter
    if (filters.httpMethods && filters.httpMethods.length > 0) {
      if (!trigger.details.httpMethod) return false
      
      // Split the trigger's httpMethod string and check if any selected method is included
      const triggerMethods = trigger.details.httpMethod
        .split(',')
        .map(m => m.trim().toUpperCase())
      
      // Check if any of the selected methods is present in the trigger's methods
      const hasSelectedMethod = filters.httpMethods.some(selectedMethod => 
        triggerMethods.includes(selectedMethod.toUpperCase())
      )
      
      if (!hasSelectedMethod) return false
    } else if (filters.httpMethod) {
      // Backward compatibility with old single method filter
      // Also check if the method is included in comma-separated string
      if (!trigger.details.httpMethod) return false
      const triggerMethods = trigger.details.httpMethod
        .split(',')
        .map(m => m.trim().toUpperCase())
      if (!triggerMethods.includes(filters.httpMethod.toUpperCase())) {
        return false
      }
    }

    // Filter by authentication (for webhooks)
    if (filters.hasAuth !== undefined) {
      if (filters.hasAuth === 'yes' && !trigger.details.hasAuth) return false
      if (filters.hasAuth === 'no' && trigger.details.hasAuth) return false
    }

    // Filter by provider (for AI)
    if (filters.provider && trigger.details.provider !== filters.provider) {
      return false
    }

    // Filter by model (for AI)
    if (filters.model && trigger.details.model !== filters.model) {
      return false
    }

    // Filter by tool type: for AI agents = "has at least one tool of this type"; for tool tab = exact match
    if (filters.toolType) {
      if (trigger.type === 'ai') {
        const normalizedTool = filters.toolType.toLowerCase()
        const hasTool = trigger.details.connectedTools?.some(
          (t) =>
            t.toolType?.toLowerCase() === normalizedTool ||
            t.toolName?.toLowerCase() === normalizedTool
        )
        const fallbackModelMatch = trigger.details.model?.toLowerCase() === normalizedTool
        if (!hasTool && !fallbackModelMatch) return false
      } else if (trigger.type === 'tool' && trigger.details.toolType !== filters.toolType) {
        return false
      }
    }

    // Filter by trigger type (for other)
    if (filters.triggerType) {
      const triggerCategory = getTriggerTypeCategory(trigger.details.triggerType || '')
      if (triggerCategory !== filters.triggerType) {
        return false
      }
    }

    return true
  })
}
