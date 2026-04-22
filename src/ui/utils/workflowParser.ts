import type { Workflow, Node, TriggerInfo, TriggerDetails, ConnectedToolInfo } from '../types'

const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL || process.env.VITE_N8N_URL || ''

/**
 * Safely extract a model ID string from an n8n model parameter.
 * n8n uses several formats: plain string, __rl resource-locator object,
 * {value: string}, {cachedResult: {value}}, etc.
 * Returns null if nothing usable is found.
 */
function extractModelString(param: unknown): string | null {
  if (!param) return null

  if (typeof param === 'string') {
    const v = param.startsWith('=') ? param.slice(1) : param
    return v.trim() || null
  }

  if (typeof param !== 'object' || param === null) return null

  const p = param as Record<string, unknown>

  // __rl (resource locator) or plain {value} format
  if (p.value !== undefined) {
    const v = p.value
    if (typeof v === 'string') return (v.startsWith('=') ? v.slice(1) : v).trim() || null
    if (typeof v === 'object' && v !== null) {
      const vObj = v as Record<string, unknown>
      const inner = String(vObj.name || vObj.id || vObj.value || '').trim()
      return inner || null
    }
  }

  // cachedResult format
  if (p.cachedResult) {
    const cr = p.cachedResult as Record<string, unknown>
    const v = cr.value
    if (typeof v === 'string') return (v.startsWith('=') ? v.slice(1) : v).trim() || null
    if (typeof v === 'object' && v !== null) {
      const vObj = v as Record<string, unknown>
      const inner = String(vObj.name || vObj.id || '').trim()
      return inner || null
    }
  }

  // Last resort: any plain string value in the object (skip structural keys)
  const skipKeys = new Set(['__rl', 'mode', 'cachedResultUrl', 'cachedResultName', 'cachedResultId'])
  for (const [key, val] of Object.entries(p)) {
    if (!skipKeys.has(key) && typeof val === 'string' && val.trim()) {
      const v = val.trim()
      return v.startsWith('=') ? v.slice(1).trim() || null : v
    }
  }

  return null
}

export function parseWorkflows(workflows: Workflow[], baseUrl?: string): TriggerInfo[] {
  const triggers: TriggerInfo[] = []

  workflows.forEach((workflow) => {
    if (!workflow.nodes || workflow.nodes.length === 0) {
      return
    }

    // Find nodes with no incoming connections (these are typically triggers)
    const nodesWithNoIncoming = workflow.nodes.filter((node) => {
      if (!workflow.connections) return true
      
      // Check if this node has any incoming connections
      // Connections in n8n use node NAMES, not node IDs
      const hasIncoming = Object.values(workflow.connections).some((connection: any) => {
        return Object.values(connection).some((outputs: any) => {
          return Array.isArray(outputs) && outputs.some((output: any[]) => 
            Array.isArray(output) && output.some((link: any) => {
              // Connection can be in different formats:
              // - Array: [nodeName, outputIndex]
              // - Object: {node: nodeName, type: string, index: number}
              // - String: nodeName
              let targetNodeName: string | null = null
              
              if (Array.isArray(link) && link.length > 0) {
                targetNodeName = link[0]
              } else if (link && typeof link === 'object' && link.node) {
                targetNodeName = link.node
              } else if (typeof link === 'string') {
                targetNodeName = link
              }
              
              return targetNodeName === node.name
            })
          )
        })
      })
      
      return !hasIncoming
    })

    // Also find nodes that are explicitly trigger types
    const explicitTriggers = workflow.nodes.filter((node) => {
      const type = node.type.toLowerCase()
      return type.includes('trigger') || 
             type.includes('webhook') ||
             type.includes('cron') ||
             type.includes('schedule') ||
             type === 'n8n-nodes-base.cron' ||
             type === 'n8n-nodes-base.webhook' ||
             type === 'n8n-nodes-base.scheduletrigger'
    })

    // Combine both sets, prioritizing explicit triggers
    const triggerNodes = explicitTriggers.length > 0 
      ? explicitTriggers 
      : nodesWithNoIncoming.length > 0 
        ? nodesWithNoIncoming 
        : [workflow.nodes[0]] // Fallback to first node

    // Remove duplicates
    const uniqueTriggerNodes = Array.from(
      new Map(triggerNodes.map(node => [node.id, node])).values()
    )

    // Parse trigger nodes
    uniqueTriggerNodes.forEach((node) => {
      const triggerInfo = parseNode(node, workflow, baseUrl)
      if (triggerInfo) {
        triggers.push(triggerInfo)
      }
    })

    // Find ALL AI agent and chain nodes in the workflow (not just triggers)
    // AI nodes can be anywhere in the workflow, not just at the start
    const aiAgentNodes = workflow.nodes.filter((node) => {
      const type = node.type.toLowerCase()
      
      // Explicitly exclude language model nodes (these should only be connected to agents, not displayed separately)
      const isLanguageModel = type.includes('languagemodel') || 
                             type.includes('language_model') ||
                             type.includes('lmchat') ||
                             type.includes('chatmodel')
      
      // Explicitly exclude output parser nodes (these are connected to agents but aren't agents themselves)
      const isOutputParser = type.includes('outputparser') ||
                            type.includes('output_parser')
      
      if (isLanguageModel || isOutputParser) {
        return false
      }
      
      // Include agent and chain nodes
      return type === '@n8n/n8n-nodes-langchain.agent' ||
             type.includes('@n8n/n8n-nodes-langchain.chain') ||
             (type.includes('agent') && type.includes('langchain')) ||
             (type.includes('chain') && type.includes('langchain'))
    })

    // Parse each AI agent node
    aiAgentNodes.forEach((node) => {
      const agentInfo = parseAIAgent(node, workflow)
      if (agentInfo) {
        triggers.push(agentInfo)
      }
    })

    // Tool nodes are used to attach connectedTools to agents (no standalone Tools tab)
    // Kept for reference: tool node types include toolVectorStore, toolFunction, toolHttpRequest, etc.
  })

  return triggers
}

function parseNode(node: Node, workflow: Workflow, baseUrl?: string): TriggerInfo | null {
  const details: TriggerDetails = {}
  let triggerType: 'cron' | 'webhook' | 'ai' | 'manual' | 'other' = 'other'

  // Parse Cron trigger
  if (node.type === 'n8n-nodes-base.cron' || 
      node.type === 'n8n-nodes-base.scheduleTrigger' ||
      node.type.includes('cron') || 
      node.type.includes('schedule')) {
    triggerType = 'cron'
    
    // N8N stores schedule data in various places depending on the trigger type
    let cronExpression = null
    let timezone = null
    
    // Check for Schedule Trigger (most common in newer N8N versions)
    // N8N Schedule Trigger stores data in parameters.rule
    if (node.parameters.rule) {
      // Check for interval-based schedules (e.g., triggerAtHour, triggerAtMinute, every X minutes)
      if (node.parameters.rule.interval && Array.isArray(node.parameters.rule.interval)) {
        const intervals = node.parameters.rule.interval
        const intervalParts: string[] = []
        
        intervals.forEach((interval: any) => {
          // Skip empty objects
          if (!interval || (typeof interval === 'object' && Object.keys(interval).length === 0)) {
            return
          }
          
          // Handle "at specific time" schedules
          if (interval.triggerAtHour !== undefined) {
            intervalParts.push(`At ${interval.triggerAtHour}:${String(interval.triggerAtMinute || 0).padStart(2, '0')}`)
          } 
          // Handle field + interval format (e.g., {field: "hours", hoursInterval: 3})
          else if (interval.field && interval.minutesInterval !== undefined) {
            const value = interval.minutesInterval
            intervalParts.push(`Every ${value} ${value === 1 ? 'minute' : 'minutes'}`)
          } else if (interval.field && interval.hoursInterval !== undefined) {
            const value = interval.hoursInterval
            intervalParts.push(`Every ${value} ${value === 1 ? 'hour' : 'hours'}`)
          } else if (interval.field && interval.daysInterval !== undefined) {
            const value = interval.daysInterval
            intervalParts.push(`Every ${value} ${value === 1 ? 'day' : 'days'}`)
          } else if (interval.field && interval.weeksInterval !== undefined) {
            const value = interval.weeksInterval
            intervalParts.push(`Every ${value} ${value === 1 ? 'week' : 'weeks'}`)
          } else if (interval.field && interval.monthsInterval !== undefined) {
            const value = interval.monthsInterval
            intervalParts.push(`Every ${value} ${value === 1 ? 'month' : 'months'}`)
          }
          // Handle field specified without explicit interval (defaults to 1)
          else if (interval.field) {
            const field = interval.field.toLowerCase()
            if (field === 'minutes' || field === 'minute') {
              intervalParts.push('Every minute')
            } else if (field === 'hours' || field === 'hour') {
              intervalParts.push('Hourly')
            } else if (field === 'days' || field === 'day') {
              intervalParts.push('Daily')
            } else if (field === 'weeks' || field === 'week') {
              intervalParts.push('Weekly')
            } else if (field === 'months' || field === 'month') {
              intervalParts.push('Monthly')
            } else {
              intervalParts.push(`Every ${field}`)
            }
          }
          // Handle "every X minutes/hours/days" schedules
          else if (interval.everyXMinutes !== undefined) {
            const value = interval.everyXMinutes
            intervalParts.push(`Every ${value} ${value === 1 ? 'minute' : 'minutes'}`)
          } else if (interval.everyXHours !== undefined) {
            const value = interval.everyXHours
            intervalParts.push(`Every ${value} ${value === 1 ? 'hour' : 'hours'}`)
          } else if (interval.everyXDays !== undefined) {
            const value = interval.everyXDays
            intervalParts.push(`Every ${value} ${value === 1 ? 'day' : 'days'}`)
          } else if (interval.everyXWeeks !== undefined) {
            const value = interval.everyXWeeks
            intervalParts.push(`Every ${value} ${value === 1 ? 'week' : 'weeks'}`)
          } else if (interval.everyXMonths !== undefined) {
            const value = interval.everyXMonths
            intervalParts.push(`Every ${value} ${value === 1 ? 'month' : 'months'}`)
          }
          // Handle alternative format: unit + value
          else if (interval.unit && interval.value !== undefined) {
            const unit = interval.unit.toLowerCase()
            const value = interval.value
            if (unit === 'minutes' || unit === 'minute') {
              intervalParts.push(`Every ${value} ${value === 1 ? 'minute' : 'minutes'}`)
            } else if (unit === 'hours' || unit === 'hour') {
              intervalParts.push(`Every ${value} ${value === 1 ? 'hour' : 'hours'}`)
            } else if (unit === 'days' || unit === 'day') {
              intervalParts.push(`Every ${value} ${value === 1 ? 'day' : 'days'}`)
            } else if (unit === 'weeks' || unit === 'week') {
              intervalParts.push(`Every ${value} ${value === 1 ? 'week' : 'weeks'}`)
            } else if (unit === 'months' || unit === 'month') {
              intervalParts.push(`Every ${value} ${value === 1 ? 'month' : 'months'}`)
            }
          }
          // Handle field-based format (alternative structure)
          else if (interval.field) {
            const field = interval.field
            if (field.unit && field.value !== undefined) {
              const unit = field.unit.toLowerCase()
              const value = field.value
              if (unit === 'minutes' || unit === 'minute') {
                intervalParts.push(`Every ${value} ${value === 1 ? 'minute' : 'minutes'}`)
              } else if (unit === 'hours' || unit === 'hour') {
                intervalParts.push(`Every ${value} ${value === 1 ? 'hour' : 'hours'}`)
              } else if (unit === 'days' || unit === 'day') {
                intervalParts.push(`Every ${value} ${value === 1 ? 'day' : 'days'}`)
              }
            }
          }
        })
        
        if (intervalParts.length > 0) {
          cronExpression = intervalParts.join(', ')
        }
        
        timezone = node.parameters.rule.timezone || 
                  node.parameters.rule.tz || 
                  node.parameters.timezone ||
                  node.parameters.tz
      }
      // Check for direct interval properties (not in array)
      else if (node.parameters.rule.interval && typeof node.parameters.rule.interval === 'object' && !Array.isArray(node.parameters.rule.interval)) {
        const interval = node.parameters.rule.interval
        // Handle field + interval format (e.g., {field: "hours", hoursInterval: 3})
        if (interval.field && interval.minutesInterval !== undefined) {
          const value = interval.minutesInterval
          cronExpression = `Every ${value} ${value === 1 ? 'minute' : 'minutes'}`
        } else if (interval.field && interval.hoursInterval !== undefined) {
          const value = interval.hoursInterval
          cronExpression = `Every ${value} ${value === 1 ? 'hour' : 'hours'}`
        } else if (interval.field && interval.daysInterval !== undefined) {
          const value = interval.daysInterval
          cronExpression = `Every ${value} ${value === 1 ? 'day' : 'days'}`
        } else if (interval.everyXMinutes !== undefined) {
          const value = interval.everyXMinutes
          cronExpression = `Every ${value} ${value === 1 ? 'minute' : 'minutes'}`
        } else if (interval.everyXHours !== undefined) {
          const value = interval.everyXHours
          cronExpression = `Every ${value} ${value === 1 ? 'hour' : 'hours'}`
        } else if (interval.unit && interval.value !== undefined) {
          const unit = interval.unit.toLowerCase()
          const value = interval.value
          if (unit === 'minutes' || unit === 'minute') {
            cronExpression = `Every ${value} ${value === 1 ? 'minute' : 'minutes'}`
          } else if (unit === 'hours' || unit === 'hour') {
            cronExpression = `Every ${value} ${value === 1 ? 'hour' : 'hours'}`
          } else if (unit === 'days' || unit === 'day') {
            cronExpression = `Every ${value} ${value === 1 ? 'day' : 'days'}`
          }
        }
        timezone = node.parameters.rule.timezone || 
                  node.parameters.rule.tz || 
                  node.parameters.timezone ||
                  node.parameters.tz
      }
      // Rule can be an object or array
      else if (Array.isArray(node.parameters.rule) && node.parameters.rule.length > 0) {
        const firstRule = node.parameters.rule[0]
        cronExpression = firstRule.cronExpression || 
                        firstRule.expression || 
                        firstRule.cron ||
                        firstRule.field ||
                        (firstRule.field && firstRule.field.cronExpression)
        timezone = firstRule.timezone || 
                   firstRule.tz || 
                   node.parameters.timezone ||
                   node.parameters.tz
      } else if (typeof node.parameters.rule === 'object' && node.parameters.rule !== null) {
        cronExpression = node.parameters.rule.cronExpression || 
                        node.parameters.rule.expression || 
                        node.parameters.rule.cron ||
                        node.parameters.rule.field ||
                        (node.parameters.rule.field && node.parameters.rule.field.cronExpression)
        timezone = node.parameters.rule.timezone || 
                  node.parameters.rule.tz || 
                  node.parameters.timezone ||
                  node.parameters.tz
      }
    }
    
    // Check for schedule field (alternative structure)
    if (!cronExpression && node.parameters.schedule) {
      const schedule = node.parameters.schedule
      if (typeof schedule === 'string') {
        cronExpression = schedule
      } else if (typeof schedule === 'object') {
        cronExpression = schedule.cronExpression || 
                        schedule.expression || 
                        schedule.cron ||
                        schedule.field
        timezone = schedule.timezone || schedule.tz || timezone
      }
    }
    
    // Check direct parameters
    if (!cronExpression) {
      cronExpression = node.parameters.cronExpression || 
                      node.parameters.expression || 
                      node.parameters.cron ||
                      node.parameters.field ||
                      node.parameters.schedule
    }
    
    // Check for triggerTimes (used in some schedule formats)
    // triggerTimes can be: {item: [{mode: "everyHour", minute: 42}, ...]}
    if (!cronExpression && node.parameters.triggerTimes) {
      let triggerTimesArray = node.parameters.triggerTimes
      
      // Check if triggerTimes has an 'item' property
      if (triggerTimesArray.item && Array.isArray(triggerTimesArray.item)) {
        triggerTimesArray = triggerTimesArray.item
      }
      
      if (Array.isArray(triggerTimesArray) && triggerTimesArray.length > 0) {
        const timeParts: string[] = []
        
        triggerTimesArray.forEach((timeItem: any) => {
          if (typeof timeItem === 'string') {
            // Simple string format
            timeParts.push(timeItem)
          } else if (typeof timeItem === 'object' && timeItem !== null) {
            // Skip empty objects
            if (Object.keys(timeItem).length === 0) {
              return
            }
            
            // Object format with mode
            const mode = timeItem.mode
            
            if (mode === 'everyHour') {
              const minute = timeItem.minute !== undefined ? timeItem.minute : 0
              timeParts.push(`Every hour at :${String(minute).padStart(2, '0')}`)
            } else if (mode === 'everyDay') {
              const hour = timeItem.hour !== undefined ? timeItem.hour : 0
              const minute = timeItem.minute !== undefined ? timeItem.minute : 0
              timeParts.push(`Daily at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
            } else if (mode === 'everyWeek') {
              const weekday = timeItem.weekday !== undefined ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeItem.weekday] || timeItem.weekday : 'Sunday'
              const hour = timeItem.hour !== undefined ? timeItem.hour : 0
              const minute = timeItem.minute !== undefined ? timeItem.minute : 0
              timeParts.push(`Weekly on ${weekday} at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
            } else if (mode === 'everyMonth') {
              const day = timeItem.day !== undefined ? timeItem.day : 1
              const hour = timeItem.hour !== undefined ? timeItem.hour : 0
              const minute = timeItem.minute !== undefined ? timeItem.minute : 0
              timeParts.push(`Monthly on day ${day} at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
            } else if (mode === 'everyX') {
              // Generic "every X units" format
              const value = timeItem.value !== undefined ? timeItem.value : 1
              const unit = timeItem.unit || 'minutes'
              timeParts.push(`Every ${value} ${unit}`)
            } else if (mode === 'custom' || mode === 'cronExpression') {
              // Custom cron expression
              const expr = timeItem.cronExpression || timeItem.expression || 'custom schedule'
              timeParts.push(expr)
            } else if (mode) {
              // Unknown mode, display as-is
              timeParts.push(mode)
            } else {
              // No mode specified, infer from properties present
              // Check what properties are available to determine the schedule type
              const hasHour = timeItem.hour !== undefined
              const hasMinute = timeItem.minute !== undefined
              const hasWeekday = timeItem.weekday !== undefined
              const hasDay = timeItem.day !== undefined
              const hasMonth = timeItem.month !== undefined
              
              if (hasMonth && hasDay && hasHour) {
                // Yearly schedule (specific month, day, and hour)
                const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][timeItem.month] || timeItem.month
                const day = timeItem.day
                const hour = timeItem.hour
                const minute = hasMinute ? timeItem.minute : 0
                timeParts.push(`Yearly on ${month} ${day} at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
              } else if (hasDay && hasHour) {
                // Monthly schedule (specific day and hour)
                const day = timeItem.day
                const hour = timeItem.hour
                const minute = hasMinute ? timeItem.minute : 0
                timeParts.push(`Monthly on day ${day} at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
              } else if (hasWeekday && hasHour) {
                // Weekly schedule (specific weekday and hour)
                const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeItem.weekday] || timeItem.weekday
                const hour = timeItem.hour
                const minute = hasMinute ? timeItem.minute : 0
                timeParts.push(`Weekly on ${weekday} at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
              } else if (hasHour) {
                // Daily schedule (specific hour)
                const hour = timeItem.hour
                const minute = hasMinute ? timeItem.minute : 0
                timeParts.push(`Daily at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
              } else if (hasMinute) {
                // Hourly schedule (specific minute)
                const minute = timeItem.minute
                timeParts.push(`Every hour at :${String(minute).padStart(2, '0')}`)
              }
            }
          }
        })
        
        if (timeParts.length > 0) {
          cronExpression = timeParts.join(', ')
        }
      }
    }
    
    // Check for item-based schedules
    if (!cronExpression && node.parameters.item) {
      const item = node.parameters.item
      if (item.cronExpression || item.expression || item.cron) {
        cronExpression = item.cronExpression || item.expression || item.cron
        timezone = item.timezone || timezone
      }
    }
    
    // Check for mode-based schedules (every X minutes/hours/etc)
    if (!cronExpression && node.parameters.mode) {
      const mode = node.parameters.mode.toLowerCase()
      const interval = node.parameters.interval || 
                      node.parameters.value || 
                      node.parameters.everyXMinutes ||
                      node.parameters.everyXHours ||
                      node.parameters.everyXDays
      
      if (interval !== undefined && interval !== null) {
        if (mode.includes('minute')) {
          cronExpression = `Every ${interval} ${interval === 1 ? 'minute' : 'minutes'}`
        } else if (mode.includes('hour')) {
          cronExpression = `Every ${interval} ${interval === 1 ? 'hour' : 'hours'}`
        } else if (mode.includes('day')) {
          cronExpression = `Every ${interval} ${interval === 1 ? 'day' : 'days'}`
        } else if (mode.includes('week')) {
          cronExpression = `Every ${interval} ${interval === 1 ? 'week' : 'weeks'}`
        } else if (mode.includes('month')) {
          cronExpression = `Every ${interval} ${interval === 1 ? 'month' : 'months'}`
        } else {
          cronExpression = `Every ${interval} ${mode}`
        }
      } else if (mode) {
        cronExpression = mode
      }
    }
    
    // Check for direct interval parameters (alternative format)
    if (!cronExpression) {
      if (node.parameters.everyXMinutes !== undefined) {
        const value = node.parameters.everyXMinutes
        cronExpression = `Every ${value} ${value === 1 ? 'minute' : 'minutes'}`
      } else if (node.parameters.everyXHours !== undefined) {
        const value = node.parameters.everyXHours
        cronExpression = `Every ${value} ${value === 1 ? 'hour' : 'hours'}`
      } else if (node.parameters.everyXDays !== undefined) {
        const value = node.parameters.everyXDays
        cronExpression = `Every ${value} ${value === 1 ? 'day' : 'days'}`
      } else if (node.parameters.unit && node.parameters.value !== undefined) {
        const unit = node.parameters.unit.toLowerCase()
        const value = node.parameters.value
        if (unit === 'minutes' || unit === 'minute') {
          cronExpression = `Every ${value} ${value === 1 ? 'minute' : 'minutes'}`
        } else if (unit === 'hours' || unit === 'hour') {
          cronExpression = `Every ${value} ${value === 1 ? 'hour' : 'hours'}`
        } else if (unit === 'days' || unit === 'day') {
          cronExpression = `Every ${value} ${value === 1 ? 'day' : 'days'}`
        }
      }
    }
    
    // If no cron expression found in parameters, check staticData for recurrenceRules
    if (!cronExpression && workflow.staticData) {
      // Try multiple possible keys for staticData
      const possibleKeys = [
        `node:${node.name}`,
        `node:${node.id}`,
        'node:Schedule Trigger',
        'node:Recurring Readwise Trigger',
      ]
      
      // Also check all keys that start with "node:"
      const nodeKeys = Object.keys(workflow.staticData).filter(key => key.startsWith('node:'))
      possibleKeys.push(...nodeKeys)
      
      for (const key of possibleKeys) {
        const nodeStaticData = workflow.staticData[key]
        
        if (nodeStaticData && nodeStaticData.recurrenceRules && Array.isArray(nodeStaticData.recurrenceRules) && nodeStaticData.recurrenceRules.length > 0) {
          // Extract from recurrence rules (RRULE format)
          const rrule = nodeStaticData.recurrenceRules[0]
          if (rrule) {
            // Try to parse RRULE or extract readable info
            if (typeof rrule === 'string') {
              // Parse RRULE string format (e.g., "FREQ=DAILY;INTERVAL=1")
              const match = rrule.match(/FREQ=(\w+)(?:;INTERVAL=(\d+))?/i)
              if (match) {
                const freq = match[1].toLowerCase()
                const interval = match[2] ? parseInt(match[2], 10) : 1
                if (freq === 'daily' || freq === 'day') {
                  cronExpression = interval === 1 ? 'Daily' : `Every ${interval} days`
                } else if (freq === 'hourly' || freq === 'hour') {
                  cronExpression = interval === 1 ? 'Hourly' : `Every ${interval} hours`
                } else if (freq === 'minutely' || freq === 'minute') {
                  cronExpression = interval === 1 ? 'Every minute' : `Every ${interval} minutes`
                } else if (freq === 'weekly' || freq === 'week') {
                  cronExpression = interval === 1 ? 'Weekly' : `Every ${interval} weeks`
                } else if (freq === 'monthly' || freq === 'month') {
                  cronExpression = interval === 1 ? 'Monthly' : `Every ${interval} months`
                } else {
                  cronExpression = `Recurring (${freq})`
                }
              } else {
                cronExpression = rrule
              }
            } else if (rrule.freq) {
              // Parse frequency-based rules
              const freq = rrule.freq.toLowerCase()
              const interval = rrule.interval || 1
              if (freq === 'daily' || freq === 'day') {
                cronExpression = interval === 1 ? 'Daily' : `Every ${interval} days`
              } else if (freq === 'hourly' || freq === 'hour') {
                cronExpression = interval === 1 ? 'Hourly' : `Every ${interval} hours`
              } else if (freq === 'minutely' || freq === 'minute') {
                cronExpression = interval === 1 ? 'Every minute' : `Every ${interval} minutes`
              } else if (freq === 'weekly' || freq === 'week') {
                cronExpression = interval === 1 ? 'Weekly' : `Every ${interval} weeks`
              } else if (freq === 'monthly' || freq === 'month') {
                cronExpression = interval === 1 ? 'Monthly' : `Every ${interval} months`
              } else {
                cronExpression = `Recurring (${freq})`
              }
            }
            
            if (cronExpression) {
              break // Found a valid expression, stop searching
            }
          }
        }
      }
    }
    
    // If still no expression found, provide a fallback message
    if (!cronExpression) {
      // Check if it's a schedule trigger with empty configuration
      // This happens when the trigger is created but not yet configured
      const hasEmptyInterval = node.parameters.rule?.interval && 
                               Array.isArray(node.parameters.rule.interval) &&
                               node.parameters.rule.interval.length > 0 &&
                               node.parameters.rule.interval.every((item: any) => 
                                 !item || (typeof item === 'object' && Object.keys(item).length === 0)
                               )
      
      const hasEmptyRecurrenceRules = workflow.staticData && 
                                      Object.keys(workflow.staticData).some(key => {
                                        const data = workflow.staticData![key]
                                        return data && 
                                               Array.isArray(data.recurrenceRules) && 
                                               data.recurrenceRules.length === 0
                                      })
      
      if (hasEmptyInterval || hasEmptyRecurrenceRules) {
        cronExpression = 'Schedule not configured'
      } else if (node.type.includes('schedule') || node.type.includes('cron')) {
        cronExpression = 'Recurring schedule (details unavailable)'
      } else {
        cronExpression = 'Not set'
      }
    }
    
    details.cronExpression = cronExpression
    details.timezone = timezone || node.parameters.timezone || 'UTC'
    
    // Add workflow tags and description to cron details
    if (workflow.tags && Array.isArray(workflow.tags)) {
      details.tags = workflow.tags.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean)
    }
    
    if (workflow.description) {
      details.description = workflow.description
    }
    
    // Log for debugging if still not found
    if (!cronExpression || cronExpression === 'Not set' || cronExpression === 'Recurring schedule (details unavailable)') {
      console.warn('Could not find cron expression for node:', 
        `\n  Type: ${node.type}`,
        `\n  Type Version: ${node.typeVersion || 'unknown'}`,
        `\n  Name: ${node.name}`,
        `\n  ID: ${node.id}`,
        '\n  Parameters keys:', Object.keys(node.parameters || {}),
        '\n  Rule structure:', node.parameters.rule ? JSON.stringify(node.parameters.rule, null, 2) : 'No rule',
        '\n  TriggerTimes structure:', node.parameters.triggerTimes ? JSON.stringify(node.parameters.triggerTimes, null, 2) : 'No triggerTimes',
        '\n  StaticData:', workflow.staticData ? JSON.stringify(workflow.staticData, null, 2) : 'No staticData',
        '\n  Full parameters:', JSON.stringify(node.parameters, null, 2)
      )
    }
  }
  // Parse Webhook trigger
  // Only parse actual webhook nodes, not other triggers that might have webhookId (like Telegram)
  else if (node.type === 'n8n-nodes-base.webhook' || 
           (node.type.includes('webhook') && !node.type.includes('Trigger'))) {
    triggerType = 'webhook'
    
    // Get webhook path - this is the custom path set in the webhook node
    const webhookPath = node.parameters.path || 
                       node.parameters.paths?.[0] || 
                       node.parameters.webhookPath
    
    // Get HTTP method(s)
    // N8N webhook nodes can accept multiple methods, default to GET if not specified
    let httpMethod: string
    
    if (node.parameters.httpMethod) {
      // Single method specified
      httpMethod = String(node.parameters.httpMethod).toUpperCase()
    } else if (node.parameters.methods && Array.isArray(node.parameters.methods)) {
      // Multiple methods specified
      httpMethod = node.parameters.methods.map((m: any) => String(m).toUpperCase()).join(', ')
    } else {
      // No method specified, default to GET
      httpMethod = 'GET'
    }
    
    details.webhookPath = webhookPath || 'default'
    details.httpMethod = httpMethod
    
    // Construct webhook URL
    // N8N uses /webhook/{path} for production (active workflows) and /webhook-test/{path} for test mode
    // The path is what's set in node.parameters.path, not the webhookId
    const resolvedBaseUrl = (baseUrl ?? N8N_URL).replace(/\/$/, '')
    const webhookType = workflow.active ? 'webhook' : 'webhook-test'
    
    if (webhookPath) {
      // Remove leading slash if present and ensure no trailing slash
      const cleanPath = webhookPath.startsWith('/') ? webhookPath.slice(1) : webhookPath
      details.webhookUrl = `${resolvedBaseUrl}/${webhookType}/${cleanPath}`
    } else if (node.webhookId) {
      // Fallback to webhookId if path is not set (for some trigger types like Telegram)
      details.webhookUrl = `${resolvedBaseUrl}/${webhookType}/${node.webhookId}`
    } else {
      details.webhookUrl = 'Not available'
    }

    // Check for authentication
    const authType = node.parameters.authentication || 
                    node.parameters.authType || 
                    node.parameters.options?.authentication ||
                    'none'
    details.authentication = authType
    details.hasAuth = authType !== 'none' && 
                     authType !== '' && 
                     authType !== undefined &&
                     authType !== 'predefinedCredentialType' // This is a placeholder, not actual auth
  }
  // Parse Manual trigger
  else if (node.type === 'n8n-nodes-base.manualTrigger' || 
           node.type.includes('manualTrigger') ||
           (node.type.includes('manual') && node.type.includes('trigger'))) {
    triggerType = 'manual'
    details.triggerType = node.type
    
    // Add workflow tags and description to manual trigger details
    if (workflow.tags && Array.isArray(workflow.tags)) {
      details.tags = workflow.tags.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean)
    }
    
    if (workflow.description) {
      details.description = workflow.description
    }
  }
  // Note: AI agents are now parsed separately in parseAIAgent function
  // This section is kept for backward compatibility but shouldn't match agent nodes
  // Other trigger types
  else {
    triggerType = 'other'
    details.triggerType = node.type
  }

  return {
    type: triggerType,
    workflowId: workflow.id,
    workflowName: workflow.name,
    active: workflow.active || false,
    nodeId: node.id,
    nodeName: node.name,
    details,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
    lastExecuted: workflow.lastExecuted,
  }
}

function isLangChainToolNode(node: Node): boolean {
  const type = node.type.toLowerCase()
  return type.includes('langchain') &&
    type.includes('tool') &&
    !type.includes('agent') &&
    !type.includes('chain') &&
    type.startsWith('@n8n/n8n-nodes-langchain.tool')
}

/** Returns tool nodes that have an outgoing connection to the given target node (e.g. agent). */
function getToolNodesConnectedTo(workflow: Workflow, targetNodeNameOrId: string): Node[] {
  const toolNodes = workflow.nodes.filter(isLangChainToolNode)
  if (!workflow.connections) return []
  const connected: Node[] = []
  for (const toolNode of toolNodes) {
    const sourceName = toolNode.name
    const conns = workflow.connections[sourceName] || workflow.connections[toolNode.id]
    if (!conns) continue
    const targets = new Set<string>()
    Object.values(conns).forEach((outputs: any) => {
      if (!Array.isArray(outputs)) return
      outputs.forEach((outputConnections: any) => {
        if (!Array.isArray(outputConnections)) return
        outputConnections.forEach((connection: any) => {
          let target: string | null = null
          if (Array.isArray(connection) && connection.length > 0) target = connection[0]
          else if (connection && typeof connection === 'object' && connection.node) target = connection.node
          else if (typeof connection === 'string') target = connection
          if (target) targets.add(target)
        })
      })
    })
    if (targets.has(targetNodeNameOrId)) connected.push(toolNode)
  }
  return connected
}

function getToolTypeFromNode(toolNode: Node): string {
  const nodeType = toolNode.type
  if (nodeType.includes('toolVectorStore')) return 'vectorStore'
  if (nodeType.includes('toolFunction')) return 'function'
  if (nodeType.includes('toolHttpRequest') || nodeType.includes('toolHttp')) return 'httpRequest'
  if (nodeType.includes('tool')) {
    const parts = nodeType.split('.')
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      const match = lastPart.match(/tool([A-Z][a-zA-Z]*)/)
      if (match?.[1]) return match[1].charAt(0).toLowerCase() + match[1].slice(1)
      if (lastPart.startsWith('tool')) {
        const without = lastPart.replace(/^tool/i, '')
        if (without) return without.charAt(0).toLowerCase() + without.slice(1)
      }
    }
  }
  return 'Unknown'
}

/** Extras for extensible tools (e.g. HTTP Request) shown on hover */
function getToolExtras(toolNode: Node): Record<string, string> | undefined {
  const type = toolNode.type.toLowerCase()
  const params = toolNode.parameters || {}
  const out: Record<string, string> = {}
  if (type.includes('toolhttprequest') || type.includes('toolhttp')) {
    const url = params.url ?? params.path
    if (url != null) {
      const v = typeof url === 'object' && url?.__rl?.value != null ? url.__rl.value : url
      if (typeof v === 'string' && v) out['URL'] = v.length > 80 ? v.slice(0, 80) + '…' : v
    }
    const method = params.method ?? params.httpMethod
    if (method != null) out['Method'] = String(method).toUpperCase()
    const auth = params.authentication
    if (auth != null && auth !== 'none') out['Auth'] = String(auth)
  }
  return Object.keys(out).length ? out : undefined
}

function buildConnectedToolInfo(toolNode: Node): ConnectedToolInfo {
  let description: string | null = toolNode.parameters?.description ?? toolNode.parameters?.desc ?? toolNode.parameters?.name ?? null
  if (!description) description = toolNode.parameters?.text ?? toolNode.parameters?.content ?? null
  if (typeof description !== 'string') description = description ? String(description) : null
  if (description && description.length > 500) description = description.slice(0, 500) + '...'
  return {
    toolName: toolNode.name || 'Unnamed Tool',
    toolType: getToolTypeFromNode(toolNode),
    toolDescription: description ?? undefined,
    toolExtras: getToolExtras(toolNode),
  }
}

function parseAIAgent(agentNode: Node, workflow: Workflow): TriggerInfo | null {
  const details: TriggerDetails = {}
  
  // Get agent name
  details.agentName = agentNode.name || 'Unnamed Agent'
  
  // Extract prompt from agent/chain node
  // Prompts can be in various places depending on node type
  let prompt = null
  
  // Check for messages.messageValues format (used by chain nodes)
  if (agentNode.parameters.messages?.messageValues && Array.isArray(agentNode.parameters.messages.messageValues)) {
    const messages = agentNode.parameters.messages.messageValues
      .map((msg: any) => msg.message || msg.content || msg.text)
      .filter(Boolean)
      .join('\n\n')
    if (messages) {
      prompt = messages
    }
  }
  // Check for prompt in parameters
  else if (agentNode.parameters.prompt) {
    prompt = agentNode.parameters.prompt
  } else if (agentNode.parameters.text) {
    prompt = agentNode.parameters.text
  } else if (agentNode.parameters.systemMessage) {
    prompt = agentNode.parameters.systemMessage
  } else if (agentNode.parameters.instructions) {
    prompt = agentNode.parameters.instructions
  } else if (agentNode.parameters.promptType === 'define' && agentNode.parameters.text) {
    prompt = agentNode.parameters.text
  }
  
  // Clean up prompt if it's an expression (starts with =)
  if (prompt && typeof prompt === 'string') {
    // Remove expression markers but keep the content
    if (prompt.startsWith('=')) {
      prompt = prompt.slice(1).trim()
    }
    // Truncate very long prompts for display
    if (prompt.length > 500) {
      prompt = prompt.substring(0, 500) + '...'
    }
  }
  
  details.prompt = prompt || 'No prompt specified'
  
  // Find connected language model to get model information
  // Models can connect TO chain/agent nodes via ai_languageModel connections
  // OR agent/chain nodes can connect FROM model nodes
  let model: string | null = null
  let provider = 'Unknown'
  
  if (workflow.connections) {
    // Strategy 1: Look for connections FROM model nodes TO this agent/chain node
    // Connections structure: connections[sourceNodeName][connectionType][outputIndex][connectionArray]
    Object.entries(workflow.connections).forEach(([sourceNodeName, connections]: [string, any]) => {
      // Find the source node (could be a model node)
      const sourceNode = workflow.nodes.find(n => n.name === sourceNodeName || n.id === sourceNodeName)
      
      if (!sourceNode) return
      
      // Check if this source node is a language model node
      const isModelNode = sourceNode.type.includes('languageModel') || 
                         sourceNode.type.includes('language_model') ||
                         sourceNode.type.includes('lmChat') ||
                         sourceNode.type.includes('llm') ||
                         sourceNode.type.includes('ai_languageModel')
      
      if (isModelNode) {
        // Check all connection types from this model node
        Object.entries(connections).forEach(([_connectionType, outputs]: [string, any]) => {
          if (!Array.isArray(outputs)) return
          
          outputs.forEach((outputConnections: any) => {
            if (!Array.isArray(outputConnections)) return
            
            outputConnections.forEach((connection: any) => {
              // Connection can be [nodeId, outputIndex] array or {node: nodeId, index: outputIndex} object
              let targetNodeId: string | null = null
              
              if (Array.isArray(connection)) {
                // Format: [nodeId, outputIndex]
                targetNodeId = connection[0]
              } else if (connection && typeof connection === 'object') {
                // Format: {node: nodeId, index: outputIndex}
                targetNodeId = connection.node
              } else if (typeof connection === 'string') {
                // Format: nodeId (string)
                targetNodeId = connection
              }
              
              // Check if this connection targets our agent/chain node
              if (targetNodeId && (targetNodeId === agentNode.id || targetNodeId === agentNode.name)) {
                // Found a model node connected to our agent/chain
                if (!model) { // Only set if we haven't found one yet
                  model = extractModelString(sourceNode.parameters.model)
                        ?? extractModelString(sourceNode.parameters.modelName)
                        ?? extractModelString(sourceNode.parameters.modelId)
                        ?? null
                  provider = extractProvider(sourceNode.type)
                }
              }
            })
          })
        })
      }
    })
    
    // Strategy 2: Look for connections FROM this agent/chain node TO model nodes
    if (!model && agentNode.name) {
      const agentConnections = workflow.connections[agentNode.name] || workflow.connections[agentNode.id]
      
      if (agentConnections) {
        Object.entries(agentConnections).forEach(([_connectionType, outputs]: [string, any]) => {
          if (!Array.isArray(outputs)) return
          
          outputs.forEach((outputConnections: any) => {
            if (!Array.isArray(outputConnections)) return
            
            outputConnections.forEach((connection: any) => {
              let targetNodeId: string | null = null
              
              if (Array.isArray(connection)) {
                targetNodeId = connection[0]
              } else if (connection && typeof connection === 'object') {
                targetNodeId = connection.node
              } else if (typeof connection === 'string') {
                targetNodeId = connection
              }
              
              if (targetNodeId) {
                const targetNode = workflow.nodes.find(n => n.id === targetNodeId || n.name === targetNodeId)
                
                if (targetNode) {
                  const isModelNode = targetNode.type.includes('languageModel') || 
                                     targetNode.type.includes('language_model') ||
                                     targetNode.type.includes('lmChat') ||
                                     targetNode.type.includes('llm') ||
                                     targetNode.type.includes('ai_languageModel')
                  
                  if (isModelNode && !model) {
                    model = extractModelString(targetNode.parameters.model)
                          ?? extractModelString(targetNode.parameters.modelName)
                          ?? extractModelString(targetNode.parameters.modelId)
                          ?? null
                    provider = extractProvider(targetNode.type)
                  }
                }
              }
            })
          })
        })
      }
    }
  }
  
  // Fallback: check if model info is directly in agent parameters (some node types embed it)
  if (!model) {
    model = extractModelString(agentNode.parameters.model)
          ?? extractModelString(agentNode.parameters.modelName)
          ?? extractModelString(agentNode.parameters.modelId)
          ?? null
    // Note: agentNode.parameters.name is the node's display name, never a model ID
  }
  
  if (provider === 'Unknown') {
    provider = extractProvider(agentNode.type)
  }
  
  details.model = model ?? undefined
  details.provider = provider

  // Attach tools connected to this agent (for pills and filter-by-tool)
  const agentNameOrId = agentNode.name || agentNode.id
  const connectedToolNodes = getToolNodesConnectedTo(workflow, agentNameOrId)
  details.connectedTools = connectedToolNodes.map(buildConnectedToolInfo)
  
  return {
    type: 'ai',
    workflowId: workflow.id,
    workflowName: workflow.name,
    active: workflow.active || false,
    nodeId: agentNode.id,
    nodeName: agentNode.name,
    details,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
    lastExecuted: workflow.lastExecuted,
  }
}

function extractProvider(nodeType: string): string {
  const lowerType = nodeType.toLowerCase()
  if (lowerType.includes('openai')) return 'OpenAI'
  if (lowerType.includes('anthropic') || lowerType.includes('claude')) return 'Anthropic'
  if (lowerType.includes('google') || lowerType.includes('gemini')) return 'Google'
  if (lowerType.includes('openrouter')) return 'OpenRouter'
  if (lowerType.includes('azure')) return 'Azure'
  if (lowerType.includes('langchain')) {
    // LangChain nodes might specify provider in the type
    if (lowerType.includes('openai')) return 'OpenAI'
    if (lowerType.includes('anthropic')) return 'Anthropic'
    if (lowerType.includes('google') || lowerType.includes('gemini')) return 'Google'
    if (lowerType.includes('openrouter')) return 'OpenRouter'
  }
  return 'Unknown'
}
