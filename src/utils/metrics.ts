import type { CampaignRow, DashboardKpis, Lead, LeadStatus, UnitSegment } from '../types'

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
