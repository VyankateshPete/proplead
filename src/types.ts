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
  pageVisits: number
  pricingPageViews: number
  demoRequests: number
  quoteRequests: number
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
  campaignRules: CampaignScoringRule[]
  exclusionRules: ExclusionRules
  learning: LearningConfig
}

export interface CampaignScoringRule {
  id: string
  label: string
  source: LeadSource
  sourceWeightBoost: number
  behaviorWeights: {
    emailOpens: number
    emailClicks: number
    adInteractions: number
    formSubmissions: number
  }
}

export interface ExclusionRules {
  inactivityDays: number
  minHealthScore: number
  excludedIndustries: string[]
}

export interface LearningConfig {
  enabled: boolean
  learningRate: number
  lookbackDays: number
}

export interface LeadValidation {
  emailValid: boolean
  phoneValid: boolean
  duplicateEmail: boolean
  duplicatePhone: boolean
  disposableEmail: boolean
  issues: string[]
}

export interface LeadEnrichment {
  providerCoverage: string[]
  confidence: number
  companySize: string
  revenueBand: string
}

export interface LeadHealth {
  score: number
  engagementScore: number
  intentScore: number
  classification: 'Sales Ready' | 'Nurture' | 'Inactive'
  recommendation: string
}

export interface AttributionTouchpoint {
  id: string
  channel: 'Meta' | 'Email' | 'Landing Page' | 'Direct'
  interaction: string
  credit: number
  timestamp: string
}

export interface MultiTouchAttribution {
  model: 'W-Shaped'
  touches: AttributionTouchpoint[]
  topChannel: AttributionTouchpoint['channel']
}

export interface LeadExclusion {
  excluded: boolean
  reasons: string[]
}

export interface LearningSnapshot {
  baselineScore: number
  adaptedScore: number
  adjustment: number
  confidence: number
  reason: string
}

export interface IntegrationConnection {
  key:
    | 'salesforce'
    | 'hubspot'
    | 'zoho'
    | 'pipedrive'
    | 'meta'
    | 'mailchimp'
    | 'activecampaign'
    | 'clearbit'
    | 'zoominfo'
    | 'linkedin'
  label: string
  connected: boolean
  statusText: string
  lastSyncAt: string
  category: 'CRM' | 'Advertising' | 'Email' | 'Enrichment'
}

export interface DashboardPreferences {
  showAlerts: boolean
  showLeadVolume: boolean
  showSourceBreakdown: boolean
  showSegments: boolean
  showTopLeads: boolean
  showForecast: boolean
  showCampaignVisualization: boolean
  showConversionProjection: boolean
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
  health: LeadHealth
  validation: LeadValidation
  enrichment: LeadEnrichment
  attribution: MultiTouchAttribution
  exclusion: LeadExclusion
  learning: LearningSnapshot
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

export interface AnomalyDetection {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  affectedCount: number
}

export interface SmartReportInsight {
  id: string
  title: string
  finding: string
  recommendation: string
  priority: 'High' | 'Medium' | 'Low'
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
