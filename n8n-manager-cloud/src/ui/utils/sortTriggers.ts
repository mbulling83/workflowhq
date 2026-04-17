import type { TriggerInfo } from '../types'
import type { SortBy, SortOrder } from '../components/SortBar'

export function sortTriggers(
  triggers: TriggerInfo[],
  sortBy: SortBy,
  sortOrder: SortOrder
): TriggerInfo[] {
  const sorted = [...triggers]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'alphabetical':
        comparison = a.workflowName.localeCompare(b.workflowName)
        break

      case 'created':
        if (!a.createdAt && !b.createdAt) {
          comparison = 0
        } else if (!a.createdAt) {
          comparison = 1 // Items without date go to end
        } else if (!b.createdAt) {
          comparison = -1 // Items without date go to end
        } else {
          const aTime = new Date(a.createdAt).getTime()
          const bTime = new Date(b.createdAt).getTime()
          comparison = aTime - bTime
        }
        break

      case 'updated':
        if (!a.updatedAt && !b.updatedAt) {
          comparison = 0
        } else if (!a.updatedAt) {
          comparison = 1 // Items without date go to end
        } else if (!b.updatedAt) {
          comparison = -1 // Items without date go to end
        } else {
          const aTime = new Date(a.updatedAt).getTime()
          const bTime = new Date(b.updatedAt).getTime()
          comparison = aTime - bTime
        }
        break

      case 'executed':
        if (!a.lastExecuted && !b.lastExecuted) {
          comparison = 0
        } else if (!a.lastExecuted) {
          comparison = 1 // Items without execution go to end
        } else if (!b.lastExecuted) {
          comparison = -1 // Items without execution go to end
        } else {
          const aTime = new Date(a.lastExecuted).getTime()
          const bTime = new Date(b.lastExecuted).getTime()
          comparison = aTime - bTime
        }
        break
    }

    // For date sorts, items without dates should always go to end regardless of sort order
    // So we only reverse the comparison if both items have dates
    if (sortOrder === 'desc' && sortBy !== 'alphabetical') {
      // Check if we're comparing items with missing dates
      const aHasDate = sortBy === 'created' ? !!a.createdAt : 
                       sortBy === 'updated' ? !!a.updatedAt : 
                       !!a.lastExecuted
      const bHasDate = sortBy === 'created' ? !!b.createdAt : 
                       sortBy === 'updated' ? !!b.updatedAt : 
                       !!b.lastExecuted
      
      // Only reverse if both have dates, otherwise keep items without dates at end
      if (aHasDate && bHasDate) {
        comparison = -comparison
      }
    } else if (sortOrder === 'desc') {
      comparison = -comparison
    }

    return comparison
  })

  return sorted
}
