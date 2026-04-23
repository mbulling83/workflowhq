const CRON_FREQUENCY_ORDER = [
  'Minutely',
  'Hourly',
  'Daily',
  'Weekly',
  'Monthly',
  'Yearly',
  'Mixed',
  'Custom',
] as const

export type CronFrequency = (typeof CRON_FREQUENCY_ORDER)[number]

const ORDER_INDEX = new Map<string, number>(
  CRON_FREQUENCY_ORDER.map((value, index) => [value, index])
)

function getCronParts(expression: string): string[] | null {
  const parts = expression.trim().split(/\s+/)
  return parts.length === 5 ? parts : null
}

function hasValue(part: string | undefined): boolean {
  return !!part && part !== '*' && part !== '?'
}

function isEveryN(part: string | undefined): boolean {
  return !!part && part.includes('/')
}

export function getCronFrequency(cronExpression?: string): CronFrequency {
  const expression = (cronExpression || '').trim()
  if (!expression) return 'Custom'

  if (expression.includes(',')) return 'Mixed'

  const normalized = expression.toLowerCase()

  if (/every \d+ minutes?|every minute/.test(normalized)) return 'Minutely'
  if (/hourly|every hour at|every \d+ hours?/.test(normalized)) return 'Hourly'
  if (/daily|daily at|every \d+ days?|at \d+:\d+/.test(normalized)) return 'Daily'
  if (/weekly|weekly on|every \d+ weeks?/.test(normalized)) return 'Weekly'
  if (/monthly|monthly on|every \d+ months?/.test(normalized)) return 'Monthly'
  if (/yearly|annually|every \d+ years?/.test(normalized)) return 'Yearly'

  const cronParts = getCronParts(expression)
  if (!cronParts) return 'Custom'

  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts

  if (hasValue(month) && hasValue(dayOfMonth)) return 'Yearly'
  if (hasValue(dayOfMonth) || hasValue(month)) return 'Monthly'
  if (hasValue(dayOfWeek)) return 'Weekly'
  if (hasValue(hour)) return 'Daily'
  if (isEveryN(hour) || (hour === '*' && hasValue(minute))) return 'Hourly'
  if (isEveryN(minute) || minute === '*') return 'Minutely'

  return 'Custom'
}

export function sortCronFrequencies(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const aOrder = ORDER_INDEX.get(a) ?? Number.MAX_SAFE_INTEGER
    const bOrder = ORDER_INDEX.get(b) ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.localeCompare(b)
  })
}
