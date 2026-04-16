import type { TriggerInfo } from '../types'

export interface ScheduledEvent {
  trigger: TriggerInfo
  scheduledTime: Date
}

/**
 * Parses a human-readable cron expression and calculates next occurrences
 * within the given date range.
 *
 * Handles formats like:
 * - "Every X minutes/hours/days/weeks/months"
 * - "Daily at HH:MM"
 * - "Weekly on [Day] at HH:MM"
 * - "Monthly on day X at HH:MM"
 * - "Every hour at :MM"
 * - "Hourly"
 * - Standard cron expressions (e.g., "0 9 * * *")
 */
export function calculateNextOccurrences(
  cronExpression: string,
  timezone: string = 'UTC',
  startDate: Date,
  endDate: Date
): Date[] {
  const occurrences: Date[] = []

  // Normalize the expression
  const expr = cronExpression.trim()

  // Parse different formats

  // Format: "Every X minutes"
  const everyMinutesMatch = expr.match(/Every (\d+) minutes?/i)
  if (everyMinutesMatch) {
    const interval = parseInt(everyMinutesMatch[1], 10)
    return generateIntervalOccurrences(startDate, endDate, interval, 'minute')
  }

  // Format: "Every X hours"
  const everyHoursMatch = expr.match(/Every (\d+) hours?/i)
  if (everyHoursMatch) {
    const interval = parseInt(everyHoursMatch[1], 10)
    return generateIntervalOccurrences(startDate, endDate, interval, 'hour')
  }

  // Format: "Every X days"
  const everyDaysMatch = expr.match(/Every (\d+) days?/i)
  if (everyDaysMatch) {
    const interval = parseInt(everyDaysMatch[1], 10)
    return generateIntervalOccurrences(startDate, endDate, interval, 'day')
  }

  // Format: "Every X weeks"
  const everyWeeksMatch = expr.match(/Every (\d+) weeks?/i)
  if (everyWeeksMatch) {
    const interval = parseInt(everyWeeksMatch[1], 10)
    return generateIntervalOccurrences(startDate, endDate, interval * 7, 'day')
  }

  // Format: "Every minute"
  if (expr.match(/Every minute/i)) {
    return generateIntervalOccurrences(startDate, endDate, 1, 'minute')
  }

  // Format: "Hourly"
  if (expr.match(/^Hourly$/i)) {
    return generateIntervalOccurrences(startDate, endDate, 1, 'hour')
  }

  // Format: "Daily"
  if (expr.match(/^Daily$/i)) {
    return generateIntervalOccurrences(startDate, endDate, 1, 'day')
  }

  // Format: "Weekly"
  if (expr.match(/^Weekly$/i)) {
    return generateIntervalOccurrences(startDate, endDate, 7, 'day')
  }

  // Format: "Monthly"
  if (expr.match(/^Monthly$/i)) {
    return generateIntervalOccurrences(startDate, endDate, 30, 'day')
  }

  // Format: "Every hour at :MM"
  const everyHourAtMatch = expr.match(/Every hour at :(\d+)/i)
  if (everyHourAtMatch) {
    const minute = parseInt(everyHourAtMatch[1], 10)
    return generateHourlyAtMinute(startDate, endDate, minute)
  }

  // Format: "Daily at HH:MM"
  const dailyAtMatch = expr.match(/Daily at (\d+):(\d+)/i)
  if (dailyAtMatch) {
    const hour = parseInt(dailyAtMatch[1], 10)
    const minute = parseInt(dailyAtMatch[2], 10)
    return generateDailyAt(startDate, endDate, hour, minute, timezone)
  }

  // Format: "Weekly on [Day] at HH:MM"
  const weeklyOnMatch = expr.match(/Weekly on (\w+) at (\d+):(\d+)/i)
  if (weeklyOnMatch) {
    const dayName = weeklyOnMatch[1]
    const hour = parseInt(weeklyOnMatch[2], 10)
    const minute = parseInt(weeklyOnMatch[3], 10)
    return generateWeeklyOn(startDate, endDate, dayName, hour, minute, timezone)
  }

  // Format: "Monthly on day X at HH:MM"
  const monthlyOnMatch = expr.match(/Monthly on day (\d+) at (\d+):(\d+)/i)
  if (monthlyOnMatch) {
    const day = parseInt(monthlyOnMatch[1], 10)
    const hour = parseInt(monthlyOnMatch[2], 10)
    const minute = parseInt(monthlyOnMatch[3], 10)
    return generateMonthlyOn(startDate, endDate, day, hour, minute, timezone)
  }

  // Format: "At HH:MM"
  const atTimeMatch = expr.match(/At (\d+):(\d+)/i)
  if (atTimeMatch) {
    const hour = parseInt(atTimeMatch[1], 10)
    const minute = parseInt(atTimeMatch[2], 10)
    return generateDailyAt(startDate, endDate, hour, minute, timezone)
  }

  // Standard cron expression format: "minute hour day month weekday"
  // We'll do a basic parsing for common patterns
  const cronParts = expr.split(/\s+/)
  if (cronParts.length === 5) {
    return parseCronExpression(cronParts, startDate, endDate, timezone)
  }

  // If we can't parse it, return empty array
  console.warn('Could not parse cron expression:', expr)
  return occurrences
}

function generateIntervalOccurrences(
  startDate: Date,
  endDate: Date,
  interval: number,
  unit: 'minute' | 'hour' | 'day'
): Date[] {
  const occurrences: Date[] = []
  const current = new Date(startDate)

  // Limit to prevent infinite loops
  const maxOccurrences = 1000
  let count = 0

  while (current <= endDate && count < maxOccurrences) {
    if (current >= startDate) {
      occurrences.push(new Date(current))
    }

    // Add interval
    if (unit === 'minute') {
      current.setMinutes(current.getMinutes() + interval)
    } else if (unit === 'hour') {
      current.setHours(current.getHours() + interval)
    } else if (unit === 'day') {
      current.setDate(current.getDate() + interval)
    }

    count++
  }

  return occurrences
}

function generateHourlyAtMinute(
  startDate: Date,
  endDate: Date,
  minute: number
): Date[] {
  const occurrences: Date[] = []
  const current = new Date(startDate)
  current.setMinutes(minute)
  current.setSeconds(0)
  current.setMilliseconds(0)

  // If we've passed the minute this hour, move to next hour
  if (current < startDate) {
    current.setHours(current.getHours() + 1)
  }

  const maxOccurrences = 1000
  let count = 0

  while (current <= endDate && count < maxOccurrences) {
    occurrences.push(new Date(current))
    current.setHours(current.getHours() + 1)
    count++
  }

  return occurrences
}

function generateDailyAt(
  startDate: Date,
  endDate: Date,
  hour: number,
  minute: number,
  _timezone: string
): Date[] {
  const occurrences: Date[] = []
  const current = new Date(startDate)
  current.setHours(hour, minute, 0, 0)

  // If we've passed the time today, start tomorrow
  if (current < startDate) {
    current.setDate(current.getDate() + 1)
  }

  const maxOccurrences = 1000
  let count = 0

  while (current <= endDate && count < maxOccurrences) {
    occurrences.push(new Date(current))
    current.setDate(current.getDate() + 1)
    count++
  }

  return occurrences
}

function generateWeeklyOn(
  startDate: Date,
  endDate: Date,
  dayName: string,
  hour: number,
  minute: number,
  _timezone: string
): Date[] {
  const occurrences: Date[] = []
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDay = dayNames.findIndex(d => d.toLowerCase() === dayName.toLowerCase())

  if (targetDay === -1) {
    return occurrences
  }

  const current = new Date(startDate)
  current.setHours(hour, minute, 0, 0)

  // Move to the next occurrence of the target day
  const currentDay = current.getDay()
  let daysToAdd = targetDay - currentDay
  if (daysToAdd < 0 || (daysToAdd === 0 && current < startDate)) {
    daysToAdd += 7
  }
  current.setDate(current.getDate() + daysToAdd)

  const maxOccurrences = 1000
  let count = 0

  while (current <= endDate && count < maxOccurrences) {
    occurrences.push(new Date(current))
    current.setDate(current.getDate() + 7)
    count++
  }

  return occurrences
}

function generateMonthlyOn(
  startDate: Date,
  endDate: Date,
  day: number,
  hour: number,
  minute: number,
  _timezone: string
): Date[] {
  const occurrences: Date[] = []
  const current = new Date(startDate)
  current.setDate(day)
  current.setHours(hour, minute, 0, 0)

  // If we've passed the day this month, move to next month
  if (current < startDate) {
    current.setMonth(current.getMonth() + 1)
  }

  const maxOccurrences = 1000
  let count = 0

  while (current <= endDate && count < maxOccurrences) {
    // Check if the day exists in this month
    if (current.getDate() === day) {
      occurrences.push(new Date(current))
    }
    current.setMonth(current.getMonth() + 1)
    count++
  }

  return occurrences
}

function parseCronExpression(
  parts: string[],
  startDate: Date,
  endDate: Date,
  timezone: string
): Date[] {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  const occurrences: Date[] = []

  // Simple parsing for common patterns
  // For example: "0 9 * * *" means 9:00 AM daily

  if (minute === '*' && hour === '*') {
    // Every minute
    return generateIntervalOccurrences(startDate, endDate, 1, 'minute')
  }

  if (hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    // Every hour at specific minute
    const min = parseInt(minute, 10)
    if (!isNaN(min)) {
      return generateHourlyAtMinute(startDate, endDate, min)
    }
  }

  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    // Daily at specific time
    const hr = parseInt(hour, 10)
    const min = parseInt(minute, 10)
    if (!isNaN(hr) && !isNaN(min)) {
      return generateDailyAt(startDate, endDate, hr, min, timezone)
    }
  }

  // For more complex cron expressions, we'd need a full cron parser library
  // For now, return empty array for unsupported patterns
  console.warn('Complex cron expression not fully supported:', parts.join(' '))
  return occurrences
}

/**
 * Gets all scheduled events for a date range from a list of triggers
 */
export function getScheduledEvents(
  triggers: TriggerInfo[],
  startDate: Date,
  endDate: Date
): ScheduledEvent[] {
  const events: ScheduledEvent[] = []

  // Only process active cron triggers
  const cronTriggers = triggers.filter(t => t.type === 'cron' && t.active)

  cronTriggers.forEach(trigger => {
    const cronExpression = trigger.details.cronExpression
    const timezone = trigger.details.timezone || 'UTC'

    if (!cronExpression ||
        cronExpression === 'Not set' ||
        cronExpression === 'Schedule not configured' ||
        cronExpression === 'Recurring schedule (details unavailable)') {
      return
    }

    const occurrences = calculateNextOccurrences(
      cronExpression,
      timezone,
      startDate,
      endDate
    )

    occurrences.forEach(scheduledTime => {
      events.push({ trigger, scheduledTime })
    })
  })

  // Sort by scheduled time
  events.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())

  return events
}

/**
 * Groups events by date (ignoring time)
 */
export function groupEventsByDate(events: ScheduledEvent[]): Map<string, ScheduledEvent[]> {
  const grouped = new Map<string, ScheduledEvent[]>()

  events.forEach(event => {
    const dateKey = formatDateKey(event.scheduledTime)
    const existing = grouped.get(dateKey) || []
    existing.push(event)
    grouped.set(dateKey, existing)
  })

  return grouped
}

/**
 * Formats a date as YYYY-MM-DD for use as a map key
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a time as HH:MM
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
