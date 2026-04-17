import type { Workflow, TriggerInfo } from '../types'

/**
 * Builds a concise text summary of workflows and triggers for the AI chat system prompt.
 */
export function buildWorkflowContext(workflows: Workflow[], triggers: TriggerInfo[]): string {
  const workflowSummaries = workflows.map((w) => {
    const active = w.active ? 'active' : 'inactive'
    const meta = [active]
    if (w.description) meta.push(`description: ${w.description}`)
    if (w.tags?.length) meta.push(`tags: ${w.tags.map((t) => t.name).join(', ')}`)
    return `- "${w.name}" (id: ${w.id}, ${meta.join(', ')})`
  })

  const triggerSummaries = triggers.map((t) => {
    const parts = [`[${t.type}]`, t.workflowName]
    const d = t.details
    if (t.type === 'cron' && d.cronExpression) parts.push(`schedule: ${d.cronExpression}`)
    if (t.type === 'webhook' && (d.webhookPath || d.webhookUrl)) parts.push(`path: ${d.webhookPath || d.webhookUrl}`)
    if (t.type === 'ai') {
      if (d.model || d.provider) parts.push(`model: ${[d.provider, d.model].filter(Boolean).join(' ')}`)
      if (d.connectedTools?.length) parts.push(`tools: ${d.connectedTools.map((ct) => ct.toolType || ct.toolName).join(', ')}`)
    }
    if (t.type === 'tool' && d.toolName) parts.push(`tool: ${d.toolName}`)
    return `  ${parts.join(' | ')}`
  })

  return [
    'Workflows in this N8N instance:',
    workflowSummaries.join('\n'),
    '',
    'Triggers (grouped by workflow):',
    triggerSummaries.join('\n'),
  ].join('\n')
}
