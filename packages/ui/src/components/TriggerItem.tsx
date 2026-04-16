import { TriggerInfo, ConnectedToolInfo } from '../types'
import ProviderLogo from './ProviderLogo'
import EditablePrompt from './EditablePrompt'
import { formatTriggerType } from '../utils/formatTriggerType'
import './TriggerItem.css'

interface TriggerItemProps {
  triggers: TriggerInfo[]
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  onPromptUpdate: (workflowId: string, nodeId: string, newPrompt: string) => Promise<void>
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

function TriggerItem({ triggers, type, onPromptUpdate }: TriggerItemProps) {
  // All triggers in the array are from the same workflow
  const workflow = triggers[0]

  // Get the configured N8N URL from localStorage or environment
  const getN8NBaseUrl = (): string | null => {
    const storedUrl = localStorage.getItem('n8n_url')
    const configuredUrl = storedUrl || import.meta.env.VITE_N8N_URL

    if (!configuredUrl) return null

    // Extract base URL from webhook URL if it contains /webhook/ or /webhook-test/
    // e.g., https://n8n.example.com/webhook/abc123 -> https://n8n.example.com
    let baseUrl = configuredUrl

    // Remove /api/v1/workflows from the end if present
    baseUrl = baseUrl.replace(/\/api\/v1\/workflows\/?$/, '')

    // If it's a webhook URL, extract just the domain
    const webhookMatch = baseUrl.match(/^(https?:\/\/[^/]+)/)
    if (webhookMatch) {
      baseUrl = webhookMatch[1]
    }

    return baseUrl
  }

  const baseUrl = getN8NBaseUrl()
  const workflowUrl = baseUrl ? `${baseUrl}/workflow/${workflow.workflowId}` : null
  
  return (
    <div className={`trigger-item ${workflow.active ? 'active' : 'inactive'}`}>
      <div className="trigger-header">
        <div className="trigger-header-left">
          <h3 className="trigger-workflow-name">{workflow.workflowName}</h3>
          {workflowUrl && (
            <a
              href={workflowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="workflow-link"
              title={`Open "${workflow.workflowName}" in N8N`}
            >
              ↗
            </a>
          )}
          {triggers.length > 1 && (
            <span className="trigger-count">{triggers.length} triggers</span>
          )}
        </div>
        <span className={`trigger-status ${workflow.active ? 'status-active' : 'status-inactive'}`}>
          {workflow.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      {triggers.map((trigger, index) => (
        <div key={`${trigger.nodeId}-${index}`} className={`trigger-node-section ${index > 0 ? 'trigger-node-separator' : ''}`}>
          {triggers.length > 1 && (
            <div className="trigger-node-header">
              <span className="trigger-node-name">{trigger.nodeName}</span>
            </div>
          )}
          
          <div className="trigger-details-grid">
            {type === 'cron' && (
              <>
                {trigger.details.description && (
                  <div className="detail-row detail-row-full">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value description-text">{trigger.details.description}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Schedule:</span>
                  <span className="detail-value schedule-value">{trigger.details.cronExpression}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Timezone:</span>
                  <span className="detail-value">{trigger.details.timezone}</span>
                </div>
                {trigger.details.tags && trigger.details.tags.length > 0 && (
                  <div className="detail-row detail-row-full">
                    <span className="detail-label">Tags:</span>
                    <div className="tags-container">
                      {trigger.details.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="tag-badge">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {type === 'webhook' && (
              <>
                <div className="detail-row">
                  <span className="detail-label">URL:</span>
                  <span className="detail-value webhook-url">{trigger.details.webhookUrl}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Method:</span>
                  <span className="detail-value">{trigger.details.httpMethod}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Authentication:</span>
                  <span className={`detail-value ${trigger.details.hasAuth ? 'auth-enabled' : 'auth-disabled'}`}>
                    {trigger.details.hasAuth ? 'Enabled' : 'None'}
                  </span>
                </div>
                {trigger.details.authentication && trigger.details.hasAuth && (
                  <div className="detail-row">
                    <span className="detail-label">Auth Type:</span>
                    <span className="detail-value">{trigger.details.authentication}</span>
                  </div>
                )}
              </>
            )}
            
            {type === 'ai' && (
              <>
                <div className="ai-info-row">
                  {trigger.details.agentName && (
                    <div className="detail-row">
                      <span className="detail-label">Agent:</span>
                      <span className="detail-value">{trigger.details.agentName}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Model:</span>
                    <span className="detail-value">{String(trigger.details.model || 'Not specified')}</span>
                  </div>
                  {trigger.details.provider && trigger.details.provider !== 'Unknown' && (
                    <div className="detail-row detail-row-provider">
                      <span className="detail-label">Provider:</span>
                      <span className="detail-value provider-with-logo">
                        <ProviderLogo provider={String(trigger.details.provider)} size="medium" />
                        <span className="provider-name">{String(trigger.details.provider)}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Tools this agent uses (from connected tool nodes in the workflow) */}
                {trigger.details.connectedTools && trigger.details.connectedTools.length > 0 && (
                  <div className="agent-tools">
                    <span className="detail-label">Tools this agent uses:</span>
                    <div className="agent-tool-pills">
                      {trigger.details.connectedTools.map((t: ConnectedToolInfo, idx: number) => {
                        const label = t.toolName || t.toolType
                        const title = buildToolPillTitle(t)
                        return (
                          <span
                            key={`${t.toolName}-${idx}`}
                            className="agent-tool-pill"
                            title={title || undefined}
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Editable prompt for AI agents */}
                {trigger.details.prompt && (
                  <EditablePrompt
                    prompt={trigger.details.prompt}
                    workflowId={trigger.workflowId}
                    nodeId={trigger.nodeId}
                    onSave={onPromptUpdate}
                  />
                )}
              </>
            )}
            
            {type === 'tool' && (
              <>
                {trigger.details.toolName && (
                  <div className="detail-row">
                    <span className="detail-label">Tool Name:</span>
                    <span className="detail-value">{trigger.details.toolName}</span>
                  </div>
                )}
                {trigger.details.toolType && (
                  <div className="detail-row">
                    <span className="detail-label">Tool Type:</span>
                    <span className="detail-value">{String(trigger.details.toolType)}</span>
                  </div>
                )}
                {trigger.details.toolDescription && (
                  <div className="detail-row detail-row-full">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value prompt-text">{trigger.details.toolDescription}</span>
                  </div>
                )}
              </>
            )}
            
            {type === 'manual' && (
              <>
                {trigger.details.description && (
                  <div className="detail-row detail-row-full">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value description-text">{trigger.details.description}</span>
                  </div>
                )}
                {trigger.details.tags && trigger.details.tags.length > 0 && (
                  <div className="detail-row detail-row-full">
                    <span className="detail-label">Tags:</span>
                    <div className="tags-container">
                      {trigger.details.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="tag-badge">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {trigger.details.triggerType && (
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{formatTriggerType(trigger.details.triggerType)}</span>
                  </div>
                )}
              </>
            )}
            
            {type === 'other' && trigger.details.triggerType && (
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{formatTriggerType(trigger.details.triggerType)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TriggerItem
