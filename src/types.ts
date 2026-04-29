export type DateRangeFilter = 'today' | 'week' | 'month' | 'quarter'

export type LeadStatus =
  | 'High Intent'
  | 'Qualified'
  | 'Nurturing'
  | 'Low Intent'
  | 'Opted Out'

export type LeadSource = 'Meta - Facebook' | 'Meta - Instagram' | 'Email'

export type UnitSegment = '1-10 units' | '11-50 units' | '51-100 units' | '100+ units'
export type GranularUnitSegment = '1-5 units' | '6-10 units' | '11-20 units' | '20+ units'

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

export interface BehavioralMetrics {
  emailOpens: number
  emailClicks: number
  adInteractions: number
  formSubmissions: number
  lastEngagedAt: string
}

export interface NurturingProgress {
  enrolled: boolean
  stage: 'Not Enrolled' | 'Intro Email' | 'Education Sequence' | 'Retargeting' | 'Sales Ready'
  progressPct: number
  nextStep: string
  nextTouchAt: string
}

export interface AutomationState {
  salesNotificationQueued: boolean
  crmAutoPush: boolean
  currentAction: string
}

export interface RoutingDecision {
  targetTeam: 'Sales' | 'Nurture' | 'RevOps'
  priority: 'P1' | 'P2' | 'P3'
  suggestedAction: string
}

export interface LeadQualityInsight {
  scoreBand: 'Excellent' | 'Good' | 'Medium' | 'Low'
  summary: string
  reasons: string[]
}

export interface ComplianceRecord {
  tcpaConsent: boolean
  compliant: boolean
  issues: string[]
}

export interface ScoringConfig {
  behavioralWeight: number
  demographicWeight: number
  highIntentThreshold: number
  qualifiedThreshold: number
  nurturingThreshold: number
  sourceWeights: {
    meta: number
    email: number
  }
  engagementWeights: {
    emailOpens: number
    emailClicks: number
    adInteractions: number
    formSubmissions: number
  }
}

export interface IntegrationConnection {
  key: 'salesforce' | 'hubspot' | 'meta' | 'mailchimp' | 'activecampaign'
  label: string
  connected: boolean
  statusText: string
  lastSyncAt: string
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
  granularSegment: GranularUnitSegment
  unitCount: number
  multifamilyOwner: boolean
  behavioral: BehavioralMetrics
  score: number
  status: LeadStatus
  forecast: LeadForecast
  tcpaConsentVerified: boolean
  optedOut: boolean
  compliance: ComplianceRecord
  nurturing: NurturingProgress
  automation: AutomationState
  routing: RoutingDecision
  qualityInsight: LeadQualityInsight
  cdpProfile: CDPProfile | null
  activityTimeline: LeadEvent[]
}

export interface AlertEvent {
  id: string
  severity: 'critical' | 'info' | 'warning'
  title: string
  description: string
  action: string
}

export interface AbTestResult {
  id: string
  experiment: string
  control: string
  variant: string
  winner: 'Control' | 'Variant'
  liftPct: number
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
