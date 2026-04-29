import type { DateRangeFilter } from '../types'

const DAY_MS = 86_400_000

export const getRangeStart = (range: DateRangeFilter, now: Date = new Date()): Date => {
  const next = new Date(now)

  if (range === 'today') {
    next.setHours(0, 0, 0, 0)
    return next
  }

  if (range === 'week') {
    return new Date(now.getTime() - 7 * DAY_MS)
  }

  if (range === 'month') {
    return new Date(now.getTime() - 30 * DAY_MS)
  }

  return new Date(now.getTime() - 90 * DAY_MS)
}

export const isInRange = (value: string, range: DateRangeFilter, now: Date = new Date()): boolean => {
  const start = getRangeStart(range, now)
  const date = new Date(value)
  return date >= start && date <= now
}
