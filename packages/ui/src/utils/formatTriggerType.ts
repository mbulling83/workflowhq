/**
 * Formats n8n node type names into user-friendly display names
 * Examples:
 *   n8n-nodes-base.telegramTrigger -> Telegram Trigger
 *   n8n-nodes-base.manualTrigger -> Manual Trigger
 *   @n8n/n8n-nodes-langchain.agent -> Agent
 */
export function formatTriggerType(nodeType: string): string {
  if (!nodeType) return 'Unknown'
  
  // Extract the last part after the last dot
  const parts = nodeType.split('.')
  const lastPart = parts[parts.length - 1]
  
  if (!lastPart) return nodeType
  
  // Convert camelCase to Title Case with spaces
  // e.g., "telegramTrigger" -> "Telegram Trigger"
  const formatted = lastPart
    // Insert space before uppercase letters
    .replace(/([A-Z])/g, ' $1')
    // Capitalize first letter
    .replace(/^./, str => str.toUpperCase())
    // Clean up extra spaces
    .trim()
  
  return formatted || nodeType
}

/**
 * Get a shorter version of the trigger type for filtering
 * This keeps common prefixes for better grouping
 */
export function getTriggerTypeCategory(nodeType: string): string {
  if (!nodeType) return 'Unknown'
  
  // Extract meaningful category from node type
  const lowerType = nodeType.toLowerCase()
  
  // Check for common patterns
  if (lowerType.includes('telegram')) return 'Telegram'
  if (lowerType.includes('slack')) return 'Slack'
  if (lowerType.includes('discord')) return 'Discord'
  if (lowerType.includes('email')) return 'Email'
  if (lowerType.includes('manual')) return 'Manual'
  if (lowerType.includes('http') || lowerType.includes('request')) return 'HTTP Request'
  if (lowerType.includes('form')) return 'Form'
  if (lowerType.includes('googlesheets')) return 'Google Sheets'
  if (lowerType.includes('googledrive')) return 'Google Drive'
  if (lowerType.includes('notion')) return 'Notion'
  if (lowerType.includes('airtable')) return 'Airtable'
  if (lowerType.includes('mqtt')) return 'MQTT'
  if (lowerType.includes('rabbitmq')) return 'RabbitMQ'
  if (lowerType.includes('redis')) return 'Redis'
  if (lowerType.includes('kafka')) return 'Kafka'
  if (lowerType.includes('sqs')) return 'AWS SQS'
  if (lowerType.includes('sns')) return 'AWS SNS'
  if (lowerType.includes('s3')) return 'AWS S3'
  if (lowerType.includes('github')) return 'GitHub'
  if (lowerType.includes('gitlab')) return 'GitLab'
  if (lowerType.includes('jira')) return 'Jira'
  if (lowerType.includes('trello')) return 'Trello'
  if (lowerType.includes('calendar')) return 'Calendar'
  if (lowerType.includes('rss')) return 'RSS'
  if (lowerType.includes('stripe')) return 'Stripe'
  if (lowerType.includes('shopify')) return 'Shopify'
  if (lowerType.includes('woocommerce')) return 'WooCommerce'
  if (lowerType.includes('twilio')) return 'Twilio'
  if (lowerType.includes('sendgrid')) return 'SendGrid'
  if (lowerType.includes('mailchimp')) return 'Mailchimp'
  if (lowerType.includes('hubspot')) return 'HubSpot'
  if (lowerType.includes('salesforce')) return 'Salesforce'
  if (lowerType.includes('zendesk')) return 'Zendesk'
  if (lowerType.includes('intercom')) return 'Intercom'
  if (lowerType.includes('clickup')) return 'ClickUp'
  if (lowerType.includes('asana')) return 'Asana'
  if (lowerType.includes('monday')) return 'Monday.com'
  if (lowerType.includes('typeform')) return 'Typeform'
  if (lowerType.includes('surveymonkey')) return 'SurveyMonkey'
  if (lowerType.includes('wordpress')) return 'WordPress'
  if (lowerType.includes('contentful')) return 'Contentful'
  if (lowerType.includes('dropbox')) return 'Dropbox'
  if (lowerType.includes('onedrive')) return 'OneDrive'
  if (lowerType.includes('box')) return 'Box'
  if (lowerType.includes('ftp')) return 'FTP'
  if (lowerType.includes('ssh')) return 'SSH'
  if (lowerType.includes('docker')) return 'Docker'
  if (lowerType.includes('kubernetes')) return 'Kubernetes'
  if (lowerType.includes('jenkins')) return 'Jenkins'
  if (lowerType.includes('circleci')) return 'CircleCI'
  if (lowerType.includes('travisci')) return 'Travis CI'
  if (lowerType.includes('bitbucket')) return 'Bitbucket'
  if (lowerType.includes('pushbullet')) return 'Pushbullet'
  if (lowerType.includes('pushover')) return 'Pushover'
  if (lowerType.includes('mattermost')) return 'Mattermost'
  if (lowerType.includes('rocketchat')) return 'Rocket.Chat'
  if (lowerType.includes('matrix')) return 'Matrix'
  if (lowerType.includes('zoom')) return 'Zoom'
  if (lowerType.includes('microsoft') && lowerType.includes('teams')) return 'Microsoft Teams'
  if (lowerType.includes('googlechat')) return 'Google Chat'
  if (lowerType.includes('aws')) return 'AWS'
  if (lowerType.includes('azure')) return 'Azure'
  if (lowerType.includes('gcp') || lowerType.includes('google cloud')) return 'Google Cloud'
  
  // Fallback: use the formatted name
  return formatTriggerType(nodeType)
}
