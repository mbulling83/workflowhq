export interface Workflow {
  id: string
  name: string
  active: boolean
  nodes: Node[]
  connections: Record<string, any>
  description?: string | null
  tags?: Array<{ id: string; name: string }>
  staticData?: Record<string, any>
  createdAt?: string
  updatedAt?: string
  lastExecuted?: string | null
}

export interface Node {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, any>
  credentials?: Record<string, any>
  webhookId?: string
}

/** Tool connected to an AI agent; used for pills and hover details */
export interface ConnectedToolInfo {
  toolName: string
  toolType: string
  toolDescription?: string | null
  /** Extensible tools (e.g. HTTP Request) can expose URL, Method, etc. for hover */
  toolExtras?: Record<string, string>
}

export interface TriggerInfo {
  type: 'cron' | 'webhook' | 'ai' | 'tool' | 'manual' | 'other'
  workflowId: string
  workflowName: string
  active: boolean
  nodeId: string
  nodeName?: string
  details: TriggerDetails
  createdAt?: string
  updatedAt?: string
  lastExecuted?: string | null
}

export interface TriggerDetails {
  // Cron trigger details
  cronExpression?: string
  timezone?: string
  tags?: string[]
  description?: string
  
  // Webhook trigger details
  webhookUrl?: string
  webhookPath?: string
  httpMethod?: string
  authentication?: string
  hasAuth?: boolean
  
  // AI agent details
  model?: string
  provider?: string
  prompt?: string
  agentName?: string
  /** Tools connected to this agent (for display as pills with optional hover details) */
  connectedTools?: ConnectedToolInfo[]

  // Tool details
  toolType?: string
  toolDescription?: string
  toolName?: string
  
  // Other
  triggerType?: string
}
