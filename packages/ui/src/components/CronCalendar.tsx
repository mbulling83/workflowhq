import { useState, useMemo } from 'react'
import { TriggerInfo } from '../types'
import { getScheduledEvents, groupEventsByDate, formatDateKey, formatTime, ScheduledEvent } from '../utils/cronScheduler'
import './CronCalendar.css'

interface CronCalendarProps {
  triggers: TriggerInfo[]
}

function CronCalendar({ triggers }: CronCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Calculate the start and end of the current month view
  const { startDate, endDate, monthStart, monthEnd } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const monthStart = new Date(year, month, 1)

    // Last day of the month
    const monthEnd = new Date(year, month + 1, 0)

    // Start from the first day of the week containing the first day of the month
    const startDate = new Date(monthStart)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    // End on the last day of the week containing the last day of the month
    const endDate = new Date(monthEnd)
    const lastDayOfWeek = endDate.getDay()
    endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek))

    return { startDate, endDate, monthStart, monthEnd }
  }, [currentDate])

  // Calculate events for the current month view (including a bit before and after)
  const events = useMemo(() => {
    // Extend the range to include some events before and after for context
    const rangeStart = new Date(startDate)
    rangeStart.setDate(rangeStart.getDate() - 7)

    const rangeEnd = new Date(endDate)
    rangeEnd.setDate(rangeEnd.getDate() + 7)

    return getScheduledEvents(triggers, rangeStart, rangeEnd)
  }, [triggers, startDate, endDate])

  // Group events by date
  const eventsByDate = useMemo(() => {
    return groupEventsByDate(events)
  }, [events])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [startDate, endDate])

  // Get events for a specific date
  const getEventsForDate = (date: Date): ScheduledEvent[] => {
    const dateKey = formatDateKey(date)
    return eventsByDate.get(dateKey) || []
  }

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return formatDateKey(date) === formatDateKey(today)
  }

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date): boolean => {
    return date >= monthStart && date <= monthEnd
  }

  // Check if a date is selected
  const isSelected = (date: Date): boolean => {
    return selectedDate !== null && formatDateKey(date) === formatDateKey(selectedDate)
  }

  // Format month and year for header
  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="cron-calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={goToPreviousMonth} className="nav-button">‹</button>
          <button onClick={goToToday} className="today-button">Today</button>
          <button onClick={goToNextMonth} className="nav-button">›</button>
        </div>
        <h2 className="calendar-title">{monthYearLabel}</h2>
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot"></span>
            <span className="legend-text">Scheduled jobs</span>
          </div>
        </div>
      </div>

      <div className="calendar-grid-container">
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            <div className="weekday">Sun</div>
            <div className="weekday">Mon</div>
            <div className="weekday">Tue</div>
            <div className="weekday">Wed</div>
            <div className="weekday">Thu</div>
            <div className="weekday">Fri</div>
            <div className="weekday">Sat</div>
          </div>

          <div className="calendar-days">
            {calendarDays.map((date, index) => {
              const dayEvents = getEventsForDate(date)
              const hasEvents = dayEvents.length > 0
              const dayClasses = [
                'calendar-day',
                isToday(date) ? 'today' : '',
                isCurrentMonth(date) ? 'current-month' : 'other-month',
                isSelected(date) ? 'selected' : '',
                hasEvents ? 'has-events' : ''
              ].filter(Boolean).join(' ')

              return (
                <div
                  key={index}
                  className={dayClasses}
                  onClick={() => handleDayClick(date)}
                >
                  <div className="day-number">{date.getDate()}</div>
                  {hasEvents && (
                    <div className="event-indicators">
                      <div className="event-dot"></div>
                      {dayEvents.length > 1 && (
                        <span className="event-count">{dayEvents.length}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="calendar-sidebar">
            <div className="sidebar-header">
              <h3>{selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}</h3>
              <button
                className="close-sidebar-button"
                onClick={() => setSelectedDate(null)}
              >
                ✕
              </button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="no-events">
                No scheduled jobs for this day
              </div>
            ) : (
              <div className="event-list">
                <div className="event-list-header">
                  {selectedDateEvents.length} scheduled job{selectedDateEvents.length !== 1 ? 's' : ''}
                </div>
                {selectedDateEvents.map((event, index) => (
                  <div key={index} className="event-item">
                    <div className="event-time">{formatTime(event.scheduledTime)}</div>
                    <div className="event-details">
                      <div className="event-workflow-name">{event.trigger.workflowName}</div>
                      {event.trigger.details.cronExpression && (
                        <div className="event-cron">{event.trigger.details.cronExpression}</div>
                      )}
                      {event.trigger.details.description && (
                        <div className="event-description">{event.trigger.details.description}</div>
                      )}
                      {event.trigger.details.tags && event.trigger.details.tags.length > 0 && (
                        <div className="event-tags">
                          {event.trigger.details.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="event-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CronCalendar
