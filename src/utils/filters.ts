import type { DateRangeFilter, Lead } from '../types'
import { getRangeStart } from './dateRange'

export const getReferenceDate = (leads: Lead[]): Date => {
  if (leads.length === 0) {
    return new Date()
  }

  return leads.reduce((latest, lead) => {
    const created = new Date(lead.createdAt)
    return created > latest ? created : latest
  }, new Date(leads[0].createdAt))
}

export const filterByRange = (leads: Lead[], range: DateRangeFilter, now: Date): Lead[] => {
  const start = getRangeStart(range, now)
  return leads.filter((lead) => {
    const created = new Date(lead.createdAt)
    return created >= start && created <= now
  })
}

