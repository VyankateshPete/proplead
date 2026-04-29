export type DateRangeFilter = 'today' | 'week' | 'month' | 'quarter'

export type LeadStatus =
  | 'High Intent'
  | 'Qualified'
  | 'Nurturing'
  | 'Low Intent'
  | 'Opted Out'

export type LeadSource = 'Meta - Facebook' | 'Meta - Instagram' | 'Email'

export type UnitSegment = '1-10 units' | '11-50 units' | '51-100 units' | '100+ units'

export interface CDPProfile {
  fullName: string
  company: string
  companyDomain: string
  jobTitle: string
  industry: string
  seniority: string
  netWorth: string
  incomeRange: string
  ageRange: string
  location: string
}

export interface LeadEvent {
  id: string
  label: string
  timestamp: string
}

export interface LeadForecast {
  day7: number
  day14: number
  day30: number
}

export interface Lead {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
  phone: string
  zipCode: string
  source: LeadSource
  campaignName: string
  unitSegment: UnitSegment
  multifamilyOwner: boolean
  score: number
  status: LeadStatus
  forecast: LeadForecast
  tcpaConsentVerified: boolean
  optedOut: boolean
  cdpProfile: CDPProfile | null
  activityTimeline: LeadEvent[]
}

export interface CampaignRow {
  campaign: string
  source: 'Facebook' | 'Instagram' | 'Email'
  leads: number
  cpl: number
  ctr: number
  conversionRate: number
  spend: number
}

export interface DashboardKpis {
  totalLeads: number
  highIntentLeads: number
  conversionRate: number
  avgLeadScore: number
}

export interface DataStore {
  leads: Lead[]
  campaigns: CampaignRow[]
}
