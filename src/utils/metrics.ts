import type {
  CampaignRow,
  DashboardKpis,
  GranularUnitSegment,
  Lead,
  LeadStatus,
  UnitSegment,
} from '../types'

export const getDisplayName = (lead: Lead): string => `${lead.firstName} ${lead.lastName}`.trim()

export const getInitials = (lead: Lead): string => {
  const first = lead.firstName[0] ?? ''
  const last = lead.lastName[0] ?? ''
  return `${first}${last}`.toUpperCase() || 'NA'
}

export const toStatusTone = (status: LeadStatus): 'critical' | 'warning' | 'success' | 'muted' | 'info' => {
  if (status === 'High Intent') return 'critical'
  if (status === 'Qualified') return 'success'
  if (status === 'Nurturing') return 'info'
  if (status === 'Opted Out') return 'muted'
  return 'warning'
}

export const getKpis = (leads: Lead[]): DashboardKpis => {
  const totalLeads = leads.length
  const highIntentLeads = leads.filter((lead) => lead.status === 'High Intent').length
  const converted = leads.filter(
    (lead) => lead.status === 'Qualified' || lead.status === 'High Intent',
  ).length

  const conversionRate = totalLeads === 0 ? 0 : (converted / totalLeads) * 100
  const avgLeadScore =
    totalLeads === 0
      ? 0
      : Math.round(leads.reduce((accumulator, lead) => accumulator + lead.score, 0) / totalLeads)

  return {
    totalLeads,
    highIntentLeads,
    conversionRate: Number(conversionRate.toFixed(1)),
    avgLeadScore,
  }
}

export const getSourceBreakdown = (leads: Lead[]): { name: string; value: number }[] => {
  const fb = leads.filter((lead) => lead.source === 'Meta - Facebook').length
  const ig = leads.filter((lead) => lead.source === 'Meta - Instagram').length
  const email = leads.filter((lead) => lead.source === 'Email').length

  return [
    { name: 'Facebook', value: fb },
    { name: 'Instagram', value: ig },
    ...(email > 0 ? [{ name: 'Email', value: email }] : []),
  ]
}

export const getSegments = (
  leads: Lead[],
): {
  segment: UnitSegment
  leads: number
}[] => {
  const order: UnitSegment[] = ['1-10 units', '11-50 units', '51-100 units', '100+ units']
  return order.map((segment) => ({
    segment,
    leads: leads.filter((lead) => lead.unitSegment === segment).length,
  }))
}

export const getLeadVolume = (leads: Lead[]): { day: string; Facebook: number; Instagram: number }[] => {
  const grouped = new Map<string, { day: string; Facebook: number; Instagram: number }>()
  const sorted = [...leads].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )

  for (const lead of sorted) {
    const day = new Date(lead.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const existing = grouped.get(day) ?? { day, Facebook: 0, Instagram: 0 }
    if (lead.source === 'Meta - Facebook') {
      existing.Facebook += 1
    } else if (lead.source === 'Meta - Instagram') {
      existing.Instagram += 1
    }
    grouped.set(day, existing)
  }

  return Array.from(grouped.values())
}

export const getCampaignTotals = (
  campaigns: CampaignRow[],
): { spend: number; leads: number; cpl: number; active: number } => {
  const spend = campaigns.reduce((accumulator, campaign) => accumulator + campaign.spend, 0)
  const leads = campaigns.reduce((accumulator, campaign) => accumulator + campaign.leads, 0)
  return {
    spend,
    leads,
    cpl: leads === 0 ? 0 : Number((spend / leads).toFixed(2)),
    active: campaigns.length,
  }
}

export const getGranularSegments = (
  leads: Lead[],
): {
  segment: GranularUnitSegment
  leads: number
  highIntentRate: number
}[] => {
  const order: GranularUnitSegment[] = ['1-5 units', '6-10 units', '11-20 units', '20+ units']

  return order.map((segment) => {
    const scoped = leads.filter((lead) => lead.granularSegment === segment)
    const highIntentCount = scoped.filter((lead) => lead.status === 'High Intent').length
    return {
      segment,
      leads: scoped.length,
      highIntentRate: scoped.length === 0 ? 0 : Number(((highIntentCount / scoped.length) * 100).toFixed(1)),
    }
  })
}

export const getPredictedHighIntentVolume = (
  leads: Lead[],
): {
  window: '7 days' | '14 days' | '30 days'
  predicted: number
}[] => {
  const windows: Array<{ key: keyof Lead['forecast']; label: '7 days' | '14 days' | '30 days' }> = [
    { key: 'day7', label: '7 days' },
    { key: 'day14', label: '14 days' },
    { key: 'day30', label: '30 days' },
  ]

  return windows.map(({ key, label }) => {
    const predicted = leads.reduce((accumulator, lead) => accumulator + lead.forecast[key] / 100, 0)
    return {
      window: label,
      predicted: Math.round(predicted),
    }
  })
}

export const getCampaignTrendSeries = (
  leads: Lead[],
): Array<{
  day: string
  leadVolume: number
  conversionRate: number
}> => {
  const grouped = new Map<
    string,
    {
      total: number
      converted: number
      label: string
    }
  >()

  for (const lead of leads) {
    const isoDay = lead.createdAt.slice(0, 10)
    const label = new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const existing = grouped.get(isoDay) ?? { total: 0, converted: 0, label }
    existing.total += 1
    if (lead.status === 'Qualified' || lead.status === 'High Intent') {
      existing.converted += 1
    }
    grouped.set(isoDay, existing)
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => (left > right ? 1 : -1))
    .map(([, value]) => ({
      day: value.label,
      leadVolume: value.total,
      conversionRate: value.total === 0 ? 0 : Number(((value.converted / value.total) * 100).toFixed(1)),
    }))
}

export const getBehaviorHistory = (
  lead: Lead,
): Array<{
  label: string
  value: number
}> => [
  { label: 'Email opens', value: lead.behavioral.emailOpens },
  { label: 'Email clicks', value: lead.behavioral.emailClicks },
  { label: 'Ad interactions', value: lead.behavioral.adInteractions },
  { label: 'Form submissions', value: lead.behavioral.formSubmissions },
]
