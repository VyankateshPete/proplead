export interface AdapterStatus {
  key: string
  connected: boolean
  message: string
}

export interface LeadIngestCandidate {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  campaign: string
  units: string
}

export interface EmailEngagementEvent {
  leadEmail: string
  opened: boolean
  clicked: boolean
  timestamp: string
  campaignName: string
}

export interface EnrichmentProfile {
  email: string
  company?: string
  companySize?: string
  industry?: string
  linkedinUrl?: string
  domain?: string
  source: 'clearbit' | 'zoominfo'
}
