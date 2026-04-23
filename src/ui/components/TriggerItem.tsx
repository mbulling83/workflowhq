import type { TriggerInfo, ConnectedToolInfo } from '../types'
import ProviderLogo from './ProviderLogo'
import EditablePrompt from './EditablePrompt'
import { formatTriggerType } from '../utils/formatTriggerType'
import { cn } from '../lib/utils'
import type { ReactNode } from 'react'
import { Badge } from './ui/badge'
import { Card, CardHeader, CardContent } from './ui/card'

interface TriggerItemProps {
  triggers: TriggerInfo[]
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  onPromptUpdate: (workflowId: string, nodeId: string, newPrompt: string) => Promise<void>
  n8nBaseUrl?: string
  isSelected?: boolean
  onSelectWorkflow?: (workflowId: string) => void
  showDetailsButton?: boolean
}

function buildToolPillTitle(t: ConnectedToolInfo): string {
  const parts: string[] = []
  if (t.toolType && t.toolType !== 'Unknown') parts.push(`Type: ${t.toolType}`)
  if (t.toolDescription) parts.push(t.toolDescription)
  if (t.toolExtras && Object.keys(t.toolExtras).length > 0) {
    parts.push(Object.entries(t.toolExtras).map(([k, v]) => `${k}: ${v}`).join('\n'))
  }
  return parts.join('\n\n')
}

function DetailRow({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={cn('flex gap-2', full ? 'flex-col' : 'flex-row items-start')}>
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0 w-20">{label}</span>
      <span className="text-sm text-slate-700 dark:text-slate-300 min-w-0">{children}</span>
    </div>
  )
}

function TriggerItem({
  triggers,
  type,
  onPromptUpdate,
  n8nBaseUrl,
  isSelected = false,
  onSelectWorkflow,
  showDetailsButton = true,
}: TriggerItemProps) {
  const workflow = triggers[0]

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
  const workflowUrl = baseUrl ? `${baseUrl}/workflow/${workflow.workflowId}` : null

  return (
    <Card className={cn(isSelected && 'ring-2 ring-slate-300 dark:ring-slate-600')}>
      <CardHeader>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {workflowUrl ? (
            <a
              href={workflowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate hover:underline underline-offset-2"
              title="Open in n8n"
            >
              {workflow.workflowName}
            </a>
          ) : (
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
              {workflow.workflowName}
            </h3>
          )}
          {triggers.length > 1 && (
            <Badge variant="secondary">{triggers.length} triggers</Badge>
          )}
        </div>
        <Badge variant={workflow.active ? 'success' : 'secondary'}>
          {workflow.active ? 'Active' : 'Inactive'}
        </Badge>
        {showDetailsButton && onSelectWorkflow && (
          <button
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-300 transition-colors"
            onClick={() => onSelectWorkflow(workflow.workflowId)}
            title="More info"
            aria-label="More info"
          >
            <span className="text-[11px] font-semibold leading-none">i</span>
          </button>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {triggers.map((trigger, index) => (
            <div key={`${trigger.nodeId}-${index}`}>
              {index > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />}
              {triggers.length > 1 && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{trigger.nodeName}</p>
              )}

              <div className="space-y-1.5">
                {type === 'cron' && (
                  <>
                    {trigger.details.description && (
                      <DetailRow label="Description" full>
                        <span className="text-slate-600 dark:text-slate-400">{trigger.details.description}</span>
                      </DetailRow>
                    )}
                    <DetailRow label="Schedule">
                      <code className="font-mono text-xs bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {trigger.details.cronExpression}
                      </code>
                    </DetailRow>
                    {trigger.details.timezone && (
                      <DetailRow label="Timezone">
                        <span className="text-slate-600 dark:text-slate-400">{trigger.details.timezone}</span>
                      </DetailRow>
                    )}
                    {trigger.details.tags && trigger.details.tags.length > 0 && (
                      <DetailRow label="Tags" full>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {trigger.details.tags.map((tag, i) => (
                            <Badge key={i} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                  </>
                )}

                {type === 'webhook' && (
                  <>
                    <DetailRow label="URL">
                      <code className="font-mono text-xs bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 break-all">
                        {trigger.details.webhookUrl}
                      </code>
                    </DetailRow>
                    <DetailRow label="Method">
                      <Badge variant="method">{trigger.details.httpMethod}</Badge>
                    </DetailRow>
                    <DetailRow label="Auth">
                      <span className={cn(
                        'text-sm',
                        trigger.details.hasAuth
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      )}>
                        {trigger.details.hasAuth ? trigger.details.authentication || 'Enabled' : 'None'}
                      </span>
                    </DetailRow>
                  </>
                )}

                {type === 'ai' && (
                  <>
                    {trigger.details.agentName && (
                      <DetailRow label="Agent">
                        <span className="text-slate-700 dark:text-slate-300">{trigger.details.agentName}</span>
                      </DetailRow>
                    )}
                    <DetailRow label="Model">
                      <div className="flex items-center gap-1.5">
                        {trigger.details.provider && trigger.details.provider !== 'Unknown' && (
                          <ProviderLogo provider={String(trigger.details.provider)} size="medium" />
                        )}
                        <span className="text-slate-700 dark:text-slate-300">
                          {String(trigger.details.model || 'Not specified')}
                        </span>
                      </div>
                    </DetailRow>
                    {trigger.details.connectedTools && trigger.details.connectedTools.length > 0 && (
                      <DetailRow label="Tools" full>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {trigger.details.connectedTools.map((t: ConnectedToolInfo, idx: number) => (
                            <Badge
                              key={`${t.toolName}-${idx}`}
                              variant="secondary"
                              className="cursor-default"
                              title={buildToolPillTitle(t) || undefined}
                            >
                              {t.toolName || t.toolType}
                            </Badge>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {trigger.details.prompt && (
                      <div className="mt-2">
                        <EditablePrompt
                          prompt={trigger.details.prompt}
                          workflowId={trigger.workflowId}
                          nodeId={trigger.nodeId}
                          onSave={onPromptUpdate}
                        />
                      </div>
                    )}
                  </>
                )}

                {type === 'tool' && (
                  <>
                    {trigger.details.toolName && (
                      <DetailRow label="Name">
                        <span className="text-slate-700 dark:text-slate-300">{trigger.details.toolName}</span>
                      </DetailRow>
                    )}
                    {trigger.details.toolType && (
                      <DetailRow label="Type">
                        <span className="text-slate-700 dark:text-slate-300">{String(trigger.details.toolType)}</span>
                      </DetailRow>
                    )}
                    {trigger.details.toolDescription && (
                      <DetailRow label="Description" full>
                        <span className="text-slate-600 dark:text-slate-400">{trigger.details.toolDescription}</span>
                      </DetailRow>
                    )}
                  </>
                )}

                {(type === 'manual' || type === 'other') && (
                  <>
                    {trigger.details.description && (
                      <DetailRow label="Description" full>
                        <span className="text-slate-600 dark:text-slate-400">{trigger.details.description}</span>
                      </DetailRow>
                    )}
                    {trigger.details.tags && trigger.details.tags.length > 0 && (
                      <DetailRow label="Tags" full>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {trigger.details.tags.map((tag, i) => (
                            <Badge key={i} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {trigger.details.triggerType && (
                      <DetailRow label="Type">
                        <span className="text-slate-600 dark:text-slate-400">{formatTriggerType(trigger.details.triggerType)}</span>
                      </DetailRow>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default TriggerItem
