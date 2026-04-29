import Papa from 'papaparse'
import { DEFAULT_SCORING_CONFIG } from '../config/defaultScoringConfig'
import {
  fetchActiveCampaignEngagement,
  fetchMailchimpEngagement,
  getClearbitAdapterStatus,
  getZoomInfoAdapterStatus,
} from '../services/adapters'
import type {
  CampaignScoringRule,
  CampaignRow,
  CDPProfile,
  ExclusionRules,
  GranularUnitSegment,
  Lead,
  LeadSource,
  LeadStatus,
  ScoringConfig,
  UnitSegment,
} from '../types'

const META_CSV_PATH = '/data/meta_leads.csv'
const CDP_CSV_PATH = '/data/internal_cdp_sample_data.csv'

const UNIT_SEGMENTS: Record<string, UnitSegment> = {
  '1_-_10_units': '1-10 units',
  '11_-_50_units': '11-50 units',
  '51_-_100_units': '51-100 units',
  '100+_units': '100+ units',
}

const UNIT_BASE_SCORES: Record<UnitSegment, number> = {
  '1-10 units': 34,
  '11-50 units': 64,
  '51-100 units': 84,
  '100+ units': 94,
}

const GRANULAR_SEGMENT_BOUNDS: Array<{
  label: GranularUnitSegment
  min: number
  max?: number
}> = [
  { label: '1-5 units', min: 1, max: 5 },
  { label: '6-10 units', min: 6, max: 10 },
  { label: '11-20 units', min: 11, max: 20 },
  { label: '20+ units', min: 21 },
]

const SOURCE_CONFIG: Record<
  LeadSource,
  {
    sourceLabel: CampaignRow['source']
    cpl: number
    ctr: number
  }
> = {
  'Meta - Facebook': { sourceLabel: 'Facebook', cpl: 12.2, ctr: 1.2 },
  'Meta - Instagram': { sourceLabel: 'Instagram', cpl: 16.4, ctr: 1.8 },
  Email: { sourceLabel: 'Email', cpl: 8.4, ctr: 2.4 },
}

const SOURCES: LeadSource[] = ['Meta - Facebook', 'Meta - Instagram', 'Email']
const DISPOSABLE_EMAIL_DOMAINS = ['mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com']

interface LearningSignal {
  adjustment: number
  confidence: number
  reason: string
}

interface EngagementBoost {
  opens: number
  clicks: number
}

const toNumberInRange = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const hashString = (value: string): number => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const parseCsv = async (path: string): Promise<Record<string, string>[]> => {
  const raw = await fetch(path)
  if (!raw.ok) {
    throw new Error(`Failed to load ${path}`)
  }
  const text = await raw.text()
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((error) => error.message).join(', '))
  }

  return parsed.data
}

const formatSource = (platformValue: string): LeadSource => {
  const platform = platformValue.toLowerCase()
  if (platform === 'fb') return 'Meta - Facebook'
  if (platform === 'ig') return 'Meta - Instagram'
  return 'Email'
}

const formatUnits = (unitsValue: string): UnitSegment => UNIT_SEGMENTS[unitsValue] ?? '1-10 units'

const normalizePhone = (phoneValue: string): string => phoneValue.replace(/^p:/, '').trim()

const normalizeZip = (zipValue: string): string => zipValue.replace(/^z:/, '').trim()

const toUnitCount = (segment: UnitSegment): number => {
  if (segment === '1-10 units') return 8
  if (segment === '11-50 units') return 26
  if (segment === '51-100 units') return 72
  return 120
}

const toGranularSegment = (unitCount: number): GranularUnitSegment => {
  const match = GRANULAR_SEGMENT_BOUNDS.find((bound) => {
    if (bound.max === undefined) return unitCount >= bound.min
    return unitCount >= bound.min && unitCount <= bound.max
  })
  return match?.label ?? '20+ units'
}

const parseDate = (value: string): Date => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }
  return parsed
}

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const isDisposableEmail = (email: string): boolean => {
  const domain = email.toLowerCase().split('@')[1] ?? ''
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain)
}

const normalizePhoneForValidation = (phone: string): string => phone.replace(/[^\d]/g, '')

const isValidPhone = (phone: string): boolean => {
  const digits = normalizePhoneForValidation(phone)
  return digits.length >= 10 && digits.length <= 15
}

const getCampaignRule = (
  scoring: ScoringConfig,
  source: LeadSource,
): CampaignScoringRule | undefined => scoring.campaignRules.find((rule) => rule.source === source)

const computeLearningSignals = (
  rows: Record<string, string>[],
  scoring: ScoringConfig,
): Record<LeadSource, LearningSignal> => {
  const bySource = new Map<LeadSource, { converted: number; total: number }>(
    SOURCES.map((source) => [source, { converted: 0, total: 0 }]),
  )

  for (const row of rows) {
    const source = formatSource(row.platform ?? '')
    const multifamilyOwner = toConsentValue(
      row['do_you_have_a_multifamily_unit_with_4+_rental_properties?'] ?? '',
    )
    const seed = hashString(`${row.id ?? ''}-${row.email ?? ''}`)
    const sourceBaseRate = source === 'Meta - Facebook' ? 0.56 : source === 'Meta - Instagram' ? 0.51 : 0.48
    const ownerAdjustment = multifamilyOwner ? 0.08 : -0.06
    const converted = (seed % 100) / 100 < toNumberInRange(sourceBaseRate + ownerAdjustment, 0.05, 0.95)
    const current = bySource.get(source)
    if (!current) continue
    current.total += 1
    if (converted) current.converted += 1
  }

  const totals = Array.from(bySource.values()).reduce(
    (accumulator, value) => ({
      converted: accumulator.converted + value.converted,
      total: accumulator.total + value.total,
    }),
    { converted: 0, total: 0 },
  )
  const overallRate = totals.total === 0 ? 0.5 : totals.converted / totals.total

  return SOURCES.reduce<Record<LeadSource, LearningSignal>>(
    (accumulator, source) => {
      const sourceStat = bySource.get(source) ?? { converted: 0, total: 0 }
      const sourceRate = sourceStat.total === 0 ? overallRate : sourceStat.converted / sourceStat.total
      const adjustment = scoring.learning.enabled
        ? Math.round((sourceRate - overallRate) * 30 * scoring.learning.learningRate)
        : 0
      const confidence = toNumberInRange(Number((0.5 + sourceStat.total / 250).toFixed(2)), 0.5, 0.95)
      const direction =
        adjustment > 0 ? 'Positive channel lift from historical outcomes' : 'Conservative channel correction'
      accumulator[source] = {
        adjustment,
        confidence,
        reason: `${direction} (${Math.round(sourceRate * 100)}% observed conversion).`,
      }
      return accumulator
    },
    {
      'Meta - Facebook': { adjustment: 0, confidence: 0.5, reason: 'No learning signal' },
      'Meta - Instagram': { adjustment: 0, confidence: 0.5, reason: 'No learning signal' },
      Email: { adjustment: 0, confidence: 0.5, reason: 'No learning signal' },
    },
  )
}

const buildCdpProfiles = (rows: Record<string, string>[]): CDPProfile[] => {
  const byUuid = new Map<string, CDPProfile>()

  for (const row of rows) {
    const uuid = row.uuid
    if (!uuid || byUuid.has(uuid)) {
      continue
    }

    const fullName = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim()
    const company = row.company_name?.trim() || 'Unknown'
    const city = row.personal_city?.trim() || row.company_city?.trim() || 'Unknown city'
    const state = row.personal_state?.trim() || row.company_state?.trim() || 'Unknown state'

    byUuid.set(uuid, {
      fullName,
      company,
      companyDomain: row.company_domain?.trim() || '',
      jobTitle: row.job_title?.trim() || 'N/A',
      industry: row.company_industry?.trim() || 'N/A',
      seniority: row.seniority_level?.trim() || 'N/A',
      netWorth: row.net_worth?.trim() || 'N/A',
      incomeRange: row.income_range?.trim() || 'N/A',
      ageRange: row.age_range?.trim() || 'N/A',
      location: `${city}, ${state}`,
    })
  }

  return Array.from(byUuid.values())
}

const buildBehavioralSignals = (
  leadId: string,
  source: LeadSource,
  createdAtDate: Date,
  boost: EngagementBoost,
): Lead['behavioral'] => {
  const baseSeed = hashString(leadId)
  const emailOpens = toNumberInRange(baseSeed % 5 + boost.opens, 0, 18)
  const emailClicks = toNumberInRange(
    Math.round(emailOpens * 0.6) + (source === 'Meta - Instagram' ? 1 : 0) + boost.clicks,
    0,
    12,
  )
  const adInteractions = toNumberInRange((baseSeed % 4) + (source === 'Meta - Facebook' ? 2 : 1), 0, 12)
  const pageVisits = toNumberInRange((baseSeed % 6) + (source === 'Email' ? 1 : 3), 1, 16)
  const pricingPageViews = toNumberInRange((baseSeed % 3) + (source !== 'Email' ? 1 : 0), 0, pageVisits)
  const demoRequests = baseSeed % 9 === 0 ? 1 : 0
  const quoteRequests = baseSeed % 7 === 0 ? 1 : 0
  const formSubmissions = quoteRequests > 0 ? 2 : 1
  const lastEngagedAt = new Date(createdAtDate.getTime() + ((baseSeed % 9) + 1) * 3_600_000).toISOString()

  return {
    emailOpens,
    emailClicks,
    adInteractions,
    formSubmissions,
    pageVisits,
    pricingPageViews,
    demoRequests,
    quoteRequests,
    lastEngagedAt,
  }
}

const getScore = (
  leadId: string,
  source: LeadSource,
  unitSegment: UnitSegment,
  behavioral: Lead['behavioral'],
  multifamilyOwner: boolean,
  createdAt: Date,
  newestDate: Date,
  scoring: ScoringConfig,
  campaignRule: CampaignScoringRule | undefined,
  learningAdjustment: number,
): {
  baseline: number
  adapted: number
  behaviorPriorityBoost: number
} => {
  const variability = (hashString(leadId) % 7) - 3
  const ownerAdjustment = multifamilyOwner ? 4 : -6
  const dayDiff = Math.max(0, (newestDate.getTime() - createdAt.getTime()) / 86_400_000)
  const recencyBonus = Math.max(0, 4 - dayDiff * 0.2)
  const behaviorPriorityBoost =
    behavioral.pricingPageViews * 2.2 + behavioral.demoRequests * 5 + behavioral.quoteRequests * 6

  const engagementRaw =
    behavioral.emailOpens * scoring.engagementWeights.emailOpens +
    behavioral.emailClicks * scoring.engagementWeights.emailClicks +
    behavioral.adInteractions * scoring.engagementWeights.adInteractions +
    behavioral.formSubmissions * scoring.engagementWeights.formSubmissions +
    behavioral.pageVisits * 3 +
    behavioral.pricingPageViews * 8 +
    behavioral.demoRequests * 16 +
    behavioral.quoteRequests * 18

  const campaignBehaviorRaw = campaignRule
    ? behavioral.emailOpens * campaignRule.behaviorWeights.emailOpens +
      behavioral.emailClicks * campaignRule.behaviorWeights.emailClicks +
      behavioral.adInteractions * campaignRule.behaviorWeights.adInteractions +
      behavioral.formSubmissions * campaignRule.behaviorWeights.formSubmissions
    : 0

  const behavioralScore = (engagementRaw / 200) * scoring.behavioralWeight
  const demographicScore =
    ((UNIT_BASE_SCORES[unitSegment] + ownerAdjustment + variability + recencyBonus) / 100) *
    scoring.demographicWeight
  const sourceWeight =
    (source === 'Email' ? scoring.sourceWeights.email : scoring.sourceWeights.meta) +
    (campaignRule?.sourceWeightBoost ?? 0)

  const rawScore =
    behavioralScore + demographicScore + sourceWeight * 0.15 + behaviorPriorityBoost + campaignBehaviorRaw * 0.03

  const baseline = toNumberInRange(Math.round(rawScore), 20, 100)
  const adapted = toNumberInRange(Math.round(baseline + learningAdjustment), 20, 100)

  return {
    baseline,
    adapted,
    behaviorPriorityBoost: Number(behaviorPriorityBoost.toFixed(1)),
  }
}

const getForecast = (score: number): Lead['forecast'] => ({
  day7: toNumberInRange(Math.round(score - 27), 8, 95),
  day14: toNumberInRange(Math.round(score - 14), 12, 97),
  day30: toNumberInRange(Math.round(score - 4), 18, 99),
})

const getStatus = (
  score: number,
  multifamilyOwner: boolean,
  optedOut: boolean,
  scoring: ScoringConfig,
): LeadStatus => {
  if (optedOut) return 'Opted Out'
  if (!multifamilyOwner && score < scoring.nurturingThreshold - 5) return 'Low Intent'
  if (score >= scoring.highIntentThreshold) return 'High Intent'
  if (score >= scoring.qualifiedThreshold) return 'Qualified'
  if (score >= scoring.nurturingThreshold) return 'Nurturing'
  return 'Low Intent'
}

const buildLeadHealth = (
  score: number,
  behavioral: Lead['behavioral'],
  highIntentThreshold: number,
): Lead['health'] => {
  const engagementScore = toNumberInRange(
    Math.round(
      behavioral.emailOpens * 3 +
        behavioral.emailClicks * 6 +
        behavioral.adInteractions * 5 +
        behavioral.formSubmissions * 10 +
        behavioral.pageVisits * 2 +
        behavioral.pricingPageViews * 9 +
        behavioral.demoRequests * 14 +
        behavioral.quoteRequests * 16,
    ),
    0,
    100,
  )
  const intentScore = score
  const healthScore = toNumberInRange(Math.round(engagementScore * 0.45 + intentScore * 0.55), 0, 100)
  const classification: Lead['health']['classification'] =
    healthScore >= 75 && intentScore >= highIntentThreshold
      ? 'Sales Ready'
      : healthScore >= 35
        ? 'Nurture'
        : 'Inactive'
  const recommendation =
    classification === 'Sales Ready'
      ? 'Immediate sales follow-up and CRM acceleration.'
      : classification === 'Nurture'
        ? 'Continue sequenced nurture with pricing and proof content.'
        : 'Pause outbound and run re-engagement or suppression rule.'

  return {
    score: healthScore,
    engagementScore,
    intentScore,
    classification,
    recommendation,
  }
}

const buildValidation = (
  email: string,
  phone: string,
  duplicateEmailCount: number,
  duplicatePhoneCount: number,
): Lead['validation'] => {
  const emailValid = isValidEmail(email)
  const phoneValid = isValidPhone(phone)
  const disposableEmail = isDisposableEmail(email)
  const duplicateEmail = duplicateEmailCount > 1
  const duplicatePhone = duplicatePhoneCount > 1
  const issues: string[] = []

  if (!emailValid) issues.push('Invalid email format')
  if (!phoneValid) issues.push('Invalid phone number format')
  if (disposableEmail) issues.push('Disposable email domain detected')
  if (duplicateEmail) issues.push('Duplicate email detected')
  if (duplicatePhone) issues.push('Duplicate phone number detected')

  return {
    emailValid,
    phoneValid,
    duplicateEmail,
    duplicatePhone,
    disposableEmail,
    issues,
  }
}

const buildEnrichment = (
  profile: CDPProfile | null,
  unitCount: number,
  providerCoverage: string[],
): Lead['enrichment'] => {
  const companySize =
    profile?.company && profile.company !== 'Unknown'
      ? unitCount >= 100
        ? 'Enterprise'
        : unitCount >= 50
          ? 'Mid-Market'
          : 'SMB'
      : 'Unknown'
  const revenueBand = unitCount >= 100 ? '$50M+' : unitCount >= 50 ? '$10M-$50M' : '$1M-$10M'
  const confidence = toNumberInRange(
    Math.round(45 + (profile ? 18 : 0) + providerCoverage.length * 12 + (profile?.industry ? 8 : 0)),
    20,
    99,
  )

  return {
    providerCoverage,
    confidence,
    companySize,
    revenueBand,
  }
}

const buildAttribution = (
  source: LeadSource,
  createdAtDate: Date,
  lastEngagedAt: string,
): Lead['attribution'] => {
  const firstTouch = new Date(createdAtDate.getTime() - 3_600_000).toISOString()
  const midTouch = new Date(createdAtDate.getTime() - 1_800_000).toISOString()
  const finalTouch = lastEngagedAt

  const touches: Lead['attribution']['touches'] =
    source === 'Email'
      ? [
          {
            id: `${createdAtDate.getTime()}-1`,
            channel: 'Email',
            interaction: 'Nurture email opened',
            credit: 0.3,
            timestamp: firstTouch,
          },
          {
            id: `${createdAtDate.getTime()}-2`,
            channel: 'Landing Page',
            interaction: 'Visited offer landing page',
            credit: 0.2,
            timestamp: midTouch,
          },
          {
            id: `${createdAtDate.getTime()}-3`,
            channel: 'Email',
            interaction: 'Clicked pricing CTA',
            credit: 0.2,
            timestamp: finalTouch,
          },
          {
            id: `${createdAtDate.getTime()}-4`,
            channel: 'Landing Page',
            interaction: 'Submitted quote form',
            credit: 0.3,
            timestamp: createdAtDate.toISOString(),
          },
        ]
      : [
          {
            id: `${createdAtDate.getTime()}-1`,
            channel: 'Meta',
            interaction: 'Clicked paid social ad',
            credit: 0.3,
            timestamp: firstTouch,
          },
          {
            id: `${createdAtDate.getTime()}-2`,
            channel: 'Landing Page',
            interaction: 'Visited campaign landing page',
            credit: 0.2,
            timestamp: midTouch,
          },
          {
            id: `${createdAtDate.getTime()}-3`,
            channel: 'Email',
            interaction: 'Opened retargeting email',
            credit: 0.2,
            timestamp: finalTouch,
          },
          {
            id: `${createdAtDate.getTime()}-4`,
            channel: 'Landing Page',
            interaction: 'Submitted lead form',
            credit: 0.3,
            timestamp: createdAtDate.toISOString(),
          },
        ]

  const creditByChannel = touches.reduce<Record<Lead['attribution']['topChannel'], number>>(
    (accumulator, touch) => {
      accumulator[touch.channel] += touch.credit
      return accumulator
    },
    { Meta: 0, Email: 0, 'Landing Page': 0, Direct: 0 },
  )

  const topChannel =
    (Object.entries(creditByChannel).sort((left, right) => right[1] - left[1])[0]?.[0] as Lead['attribution']['topChannel']) ??
    'Direct'

  return {
    model: 'W-Shaped',
    touches,
    topChannel,
  }
}

const buildExclusion = (
  validation: Lead['validation'],
  health: Lead['health'],
  optedOut: boolean,
  industry: string,
  lastEngagedAt: string,
  exclusionRules: ExclusionRules,
  newestDate: Date,
): Lead['exclusion'] => {
  const reasons: string[] = []
  if (!validation.emailValid || !validation.phoneValid || validation.disposableEmail) {
    reasons.push('Invalid or untrusted contact data')
  }

  const inactiveDays = Math.max(
    0,
    (newestDate.getTime() - new Date(lastEngagedAt).getTime()) / 86_400_000,
  )
  if (inactiveDays > exclusionRules.inactivityDays) {
    reasons.push(`No engagement for ${Math.floor(inactiveDays)} days`)
  }
  if (health.score < exclusionRules.minHealthScore) {
    reasons.push(`Health score below ${exclusionRules.minHealthScore}`)
  }
  if (
    industry &&
    exclusionRules.excludedIndustries.some((keyword) =>
      industry.toLowerCase().includes(keyword.toLowerCase()),
    )
  ) {
    reasons.push(`Excluded industry: ${industry}`)
  }
  if (optedOut) reasons.push('Lead opted out')

  return {
    excluded: reasons.length > 0,
    reasons,
  }
}

const toDisplayTime = (createdAt: Date): string =>
  createdAt.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

const toCampaignRows = (leads: Lead[]): CampaignRow[] => {
  const grouped = new Map<LeadSource, Lead[]>()

  for (const lead of leads) {
    const existing = grouped.get(lead.source) ?? []
    existing.push(lead)
    grouped.set(lead.source, existing)
  }

  return Array.from(grouped.entries()).map(([source, sourceLeads]) => {
    const config = SOURCE_CONFIG[source]
    const conversions = sourceLeads.filter(
      (lead) => lead.status === 'Qualified' || lead.status === 'High Intent',
    ).length
    const conversionRate = sourceLeads.length === 0 ? 0 : (conversions / sourceLeads.length) * 100

    return {
      campaign: sourceLeads[0]?.campaignName ?? 'Untitled campaign',
      source: config.sourceLabel,
      leads: sourceLeads.length,
      cpl: config.cpl,
      ctr: config.ctr,
      conversionRate: Number(conversionRate.toFixed(1)),
      spend: Math.round(sourceLeads.length * config.cpl),
    }
  })
}

const buildNurturing = (
  status: LeadStatus,
  createdAtDate: Date,
  health: Lead['health'],
  exclusion: Lead['exclusion'],
): Lead['nurturing'] => {
  if (
    status !== 'Low Intent' &&
    status !== 'Nurturing' &&
    health.classification !== 'Nurture' &&
    !exclusion.excluded
  ) {
    return {
      enrolled: false,
      stage: 'Not Enrolled',
      progressPct: 0,
      nextStep: 'No active nurturing sequence',
      nextTouchAt: createdAtDate.toISOString(),
    }
  }

  const nowish = createdAtDate.getTime()
  const stageCycle: Lead['nurturing']['stage'][] = ['Intro Email', 'Education Sequence', 'Retargeting']
  const stage = stageCycle[hashString(createdAtDate.toISOString()) % stageCycle.length]
  const progressByStage: Record<Lead['nurturing']['stage'], number> = {
    'Not Enrolled': 0,
    'Intro Email': 25,
    'Education Sequence': 60,
    Retargeting: 85,
    'Sales Ready': 100,
  }

  return {
    enrolled: true,
    stage,
    progressPct: progressByStage[stage],
    nextStep:
      stage === 'Intro Email'
        ? 'Send case-study email'
        : stage === 'Education Sequence'
          ? 'Schedule webinar nurture'
          : 'Launch retargeting ad set',
    nextTouchAt: new Date(nowish + 24 * 3_600_000).toISOString(),
  }
}

const buildAutomation = (status: LeadStatus, exclusion: Lead['exclusion']): Lead['automation'] => {
  if (exclusion.excluded) {
    return {
      salesNotificationQueued: false,
      crmAutoPush: false,
      currentAction: 'Suppress outreach and route to data hygiene queue',
    }
  }
  if (status === 'High Intent') {
    return {
      salesNotificationQueued: true,
      crmAutoPush: true,
      currentAction: 'Auto-push to Salesforce queue',
    }
  }
  if (status === 'Qualified') {
    return {
      salesNotificationQueued: true,
      crmAutoPush: false,
      currentAction: 'Notify sales rep for manual qualification',
    }
  }
  return {
    salesNotificationQueued: false,
    crmAutoPush: false,
    currentAction: 'Nurture sequence automation',
  }
}

const buildRoutingDecision = (
  lead: Pick<Lead, 'status' | 'score' | 'source' | 'health' | 'exclusion'>,
): Lead['routing'] => {
  if (lead.exclusion.excluded) {
    return {
      targetTeam: 'RevOps',
      priority: 'P1',
      suggestedAction: 'Run verification workflow before any outreach',
    }
  }
  if (lead.health.classification === 'Sales Ready') {
    return {
      targetTeam: 'Sales',
      priority: 'P1',
      suggestedAction: 'Call lead immediately and trigger proposal workflow',
    }
  }
  if (lead.status === 'High Intent') {
    return {
      targetTeam: 'Sales',
      priority: 'P1',
      suggestedAction: 'Call lead within 15 minutes and send proposal packet',
    }
  }
  if (lead.status === 'Qualified') {
    return {
      targetTeam: 'Sales',
      priority: 'P2',
      suggestedAction: 'Assign account executive and schedule consult',
    }
  }
  if (lead.status === 'Nurturing') {
    return {
      targetTeam: 'Nurture',
      priority: 'P2',
      suggestedAction:
        lead.source === 'Email'
          ? 'Send context-aware nurture email with case study'
          : 'Run retargeting ad + pricing explainer email',
    }
  }
  return {
    targetTeam: 'RevOps',
    priority: 'P3',
    suggestedAction: 'Validate lead data and continue low-intent workflow',
  }
}

const buildQualityInsight = (
  lead: Pick<Lead, 'behavioral' | 'score' | 'status' | 'unitSegment' | 'health' | 'exclusion'>,
): Lead['qualityInsight'] => {
  const reasons = [
    `${lead.behavioral.adInteractions} ad interactions`,
    `${lead.behavioral.emailOpens} email opens`,
    `${lead.behavioral.emailClicks} email clicks`,
    `${lead.behavioral.pricingPageViews} pricing views`,
    `${lead.unitSegment} portfolio segment`,
    `Health ${lead.health.score}`,
  ]
  if (lead.exclusion.excluded) {
    reasons.push('Currently excluded from active outreach')
  }

  if (lead.score >= 85) {
    return {
      scoreBand: 'Excellent',
      summary: 'Lead demonstrates strong conversion intent and high-value profile.',
      reasons,
    }
  }
  if (lead.score >= 65) {
    return {
      scoreBand: 'Good',
      summary: 'Lead is qualified with solid engagement signals.',
      reasons,
    }
  }
  if (lead.score >= 45) {
    return {
      scoreBand: 'Medium',
      summary: 'Lead has moderate engagement and should stay in nurture flow.',
      reasons,
    }
  }
  return {
    scoreBand: 'Low',
    summary: 'Lead quality is currently low and needs additional qualification signals.',
    reasons,
  }
}

const toConsentValue = (raw: string): boolean => raw.toLowerCase() === 'yes'

const buildCompliance = (multifamilyConsent: boolean, optedOut: boolean): Lead['compliance'] => {
  const issues: string[] = []
  if (!multifamilyConsent) {
    issues.push('Missing explicit multifamily confirmation in lead form')
  }
  if (optedOut) {
    issues.push('Lead is opted out from outreach')
  }
  return {
    tcpaConsent: multifamilyConsent,
    compliant: issues.length === 0,
    issues,
  }
}

export const exportLeadsToCsv = (leads: Lead[]): string =>
  Papa.unparse(
    leads.map((lead) => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      healthScore: lead.health.score,
      healthClass: lead.health.classification,
      unitSegment: lead.unitSegment,
      granularSegment: lead.granularSegment,
      unitCount: lead.unitCount,
      compliant: lead.compliance.compliant ? 'yes' : 'no',
      validEmail: lead.validation.emailValid ? 'yes' : 'no',
      validPhone: lead.validation.phoneValid ? 'yes' : 'no',
      excluded: lead.exclusion.excluded ? 'yes' : 'no',
      nurturingStage: lead.nurturing.stage,
      forecast7d: lead.forecast.day7,
      forecast14d: lead.forecast.day14,
      forecast30d: lead.forecast.day30,
      topAttributionChannel: lead.attribution.topChannel,
    })),
  )

const buildEngagementBoostByEmail = async (): Promise<Map<string, EngagementBoost>> => {
  const map = new Map<string, EngagementBoost>()
  const [mailchimpResult, activeCampaignResult] = await Promise.allSettled([
    fetchMailchimpEngagement(25),
    fetchActiveCampaignEngagement(25),
  ])

  const events: Array<{ leadEmail: string; opened: boolean; clicked: boolean }> = []
  if (mailchimpResult.status === 'fulfilled') {
    events.push(...mailchimpResult.value.events)
  }
  if (activeCampaignResult.status === 'fulfilled') {
    events.push(...activeCampaignResult.value.events)
  }

  for (const event of events) {
    const key = event.leadEmail.toLowerCase().trim()
    if (!key) continue
    const current = map.get(key) ?? { opens: 0, clicks: 0 }
    if (event.opened) current.opens += 1
    if (event.clicked) current.clicks += 1
    map.set(key, current)
  }

  return map
}

const buildDuplicateCountMap = (values: string[]): Map<string, number> => {
  const map = new Map<string, number>()
  for (const value of values) {
    const key = value.toLowerCase().trim()
    if (!key) continue
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

export const loadLeadData = async (
  scoring: ScoringConfig = DEFAULT_SCORING_CONFIG,
): Promise<{ leads: Lead[]; campaigns: CampaignRow[] }> => {
  const [metaRows, cdpRows] = await Promise.all([parseCsv(META_CSV_PATH), parseCsv(CDP_CSV_PATH)])
  const cdpProfiles = buildCdpProfiles(cdpRows)

  const allDates = metaRows.map((row) => parseDate(row.created_time))
  const newestDate = allDates.reduce(
    (newest, current) => (current > newest ? current : newest),
    allDates[0] ?? new Date(),
  )
  const learningSignals = computeLearningSignals(metaRows, scoring)
  const engagementBoostByEmail = await buildEngagementBoostByEmail()
  const emailCounts = buildDuplicateCountMap(metaRows.map((row) => row.email ?? ''))
  const phoneCounts = buildDuplicateCountMap(metaRows.map((row) => normalizePhone(row.phone_number ?? '')))
  const clearbitStatus = getClearbitAdapterStatus()
  const zoomInfoStatus = getZoomInfoAdapterStatus()
  const providerCoverage = [
    clearbitStatus.connected ? 'Clearbit' : null,
    zoomInfoStatus.connected ? 'ZoomInfo' : null,
    'LinkedIn',
  ].filter(Boolean) as string[]

  const leads = metaRows.map((row) => {
    const id = row.id
    const createdAtDate = parseDate(row.created_time)
    const createdAt = createdAtDate.toISOString()
    const multifamilyOwner = toConsentValue(
      row['do_you_have_a_multifamily_unit_with_4+_rental_properties?'] ?? '',
    )
    const source = formatSource(row.platform ?? '')
    const unitSegment = formatUnits(row['how_many_total_units_do_you_have_across_your_properties?'])
    const email = (row.email ?? '').trim()
    const phone = normalizePhone(row.phone_number ?? '')
    const boost = engagementBoostByEmail.get(email.toLowerCase()) ?? { opens: 0, clicks: 0 }
    const behavioral = buildBehavioralSignals(id, source, createdAtDate, boost)
    const campaignRule = getCampaignRule(scoring, source)
    const learningSignal = learningSignals[source]
    const scoringResult = getScore(
      id,
      source,
      unitSegment,
      behavioral,
      multifamilyOwner,
      createdAtDate,
      newestDate,
      scoring,
      campaignRule,
      learningSignal.adjustment,
    )
    const optedOut = hashString(id) % 29 === 0
    const status = getStatus(scoringResult.adapted, multifamilyOwner, optedOut, scoring)
    const profileIndex = hashString(`${id}-${row.email}`) % cdpProfiles.length
    const matchedProfile = cdpProfiles[profileIndex] ?? null
    const unitCount = toUnitCount(unitSegment)
    const granularSegment = toGranularSegment(unitCount)
    const validation = buildValidation(
      email,
      phone,
      emailCounts.get(email.toLowerCase()) ?? 0,
      phoneCounts.get(phone.toLowerCase()) ?? 0,
    )
    const enrichment = buildEnrichment(matchedProfile, unitCount, providerCoverage)
    const health = buildLeadHealth(scoringResult.adapted, behavioral, scoring.highIntentThreshold)
    const exclusion = buildExclusion(
      validation,
      health,
      optedOut,
      matchedProfile?.industry ?? '',
      behavioral.lastEngagedAt,
      scoring.exclusionRules,
      newestDate,
    )
    const compliance = buildCompliance(multifamilyOwner, optedOut)
    const nurturing = buildNurturing(status, createdAtDate, health, exclusion)
    const automation = buildAutomation(status, exclusion)
    const routing = buildRoutingDecision({ status, score: scoringResult.adapted, source, health, exclusion })
    const qualityInsight = buildQualityInsight({
      behavioral,
      score: scoringResult.adapted,
      status,
      unitSegment,
      health,
      exclusion,
    })
    const attribution = buildAttribution(source, createdAtDate, behavioral.lastEngagedAt)

    const activityTime = toDisplayTime(createdAtDate)

    return {
      id,
      createdAt,
      firstName: row.first_name ?? '',
      lastName: row.last_name ?? '',
      email,
      phone,
      zipCode: normalizeZip(row.zip_code ?? ''),
      source,
      campaignName: row.campaign_name ?? 'Unknown campaign',
      unitSegment,
      granularSegment,
      unitCount,
      multifamilyOwner,
      behavioral,
      score: scoringResult.adapted,
      status,
      forecast: getForecast(scoringResult.adapted),
      tcpaConsentVerified: multifamilyOwner,
      optedOut,
      compliance,
      nurturing,
      automation,
      routing,
      qualityInsight,
      health,
      validation,
      enrichment,
      attribution,
      exclusion,
      learning: {
        baselineScore: scoringResult.baseline,
        adaptedScore: scoringResult.adapted,
        adjustment: scoringResult.adapted - scoringResult.baseline,
        confidence: learningSignal.confidence,
        reason: learningSignal.reason,
      },
      cdpProfile: scoringResult.adapted >= 60 || status === 'High Intent' ? matchedProfile : null,
      activityTimeline: [
        {
          id: `${id}-1`,
          label: `Clicked ${source.includes('Instagram') ? 'Instagram' : 'Facebook'} ad: ${row.ad_name ?? row.campaign_name ?? 'Campaign'}`,
          timestamp: activityTime,
        },
        {
          id: `${id}-2`,
          label: `Submitted Meta lead form (${row.form_name ?? 'Lead Form'})`,
          timestamp: activityTime,
        },
        {
          id: `${id}-3`,
          label: `${multifamilyOwner ? 'Confirmed' : 'Did not confirm'} multifamily ownership · ${unitSegment}`,
          timestamp: activityTime,
        },
        {
          id: `${id}-4`,
          label: matchedProfile
            ? `Matched CDP profile · ${matchedProfile.jobTitle} at ${matchedProfile.company}`
            : 'No CDP profile matched',
          timestamp: activityTime,
        },
        {
          id: `${id}-5`,
          label: `Behavioral engagement · ${behavioral.emailOpens} opens, ${behavioral.emailClicks} clicks, ${behavioral.pricingPageViews} pricing views`,
          timestamp: toDisplayTime(new Date(behavioral.lastEngagedAt)),
        },
        {
          id: `${id}-6`,
          label: `Lead health ${health.score} (${health.classification}) · ${health.recommendation}`,
          timestamp: toDisplayTime(new Date(behavioral.lastEngagedAt)),
        },
        {
          id: `${id}-7`,
          label: exclusion.excluded
            ? `Excluded from active routing · ${exclusion.reasons.join(', ')}`
            : `Validation passed · ${validation.issues.length === 0 ? 'no data issues detected' : validation.issues.join(', ')}`,
          timestamp: activityTime,
        },
        {
          id: `${id}-8`,
          label: `MTA top channel ${attribution.topChannel} · learning adjustment ${scoringResult.adapted - scoringResult.baseline}`,
          timestamp: activityTime,
        },
      ],
    } satisfies Lead
  })

  return {
    leads,
    campaigns: toCampaignRows(leads),
  }
}
