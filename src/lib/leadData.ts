import Papa from 'papaparse'
import { DEFAULT_SCORING_CONFIG } from '../config/defaultScoringConfig'
import type {
  CampaignRow,
  CDPProfile,
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
): Lead['behavioral'] => {
  const baseSeed = hashString(leadId)
  const emailOpens = baseSeed % 5
  const emailClicks = Math.round(emailOpens * 0.6) + (source === 'Meta - Instagram' ? 1 : 0)
  const adInteractions = (baseSeed % 4) + (source === 'Meta - Facebook' ? 2 : 1)
  const formSubmissions = 1
  const lastEngagedAt = new Date(createdAtDate.getTime() + ((baseSeed % 9) + 1) * 3_600_000).toISOString()

  return {
    emailOpens,
    emailClicks,
    adInteractions,
    formSubmissions,
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
): number => {
  const variability = (hashString(leadId) % 7) - 3
  const ownerAdjustment = multifamilyOwner ? 4 : -6
  const dayDiff = Math.max(0, (newestDate.getTime() - createdAt.getTime()) / 86_400_000)
  const recencyBonus = Math.max(0, 4 - dayDiff * 0.2)

  const engagementRaw =
    behavioral.emailOpens * scoring.engagementWeights.emailOpens +
    behavioral.emailClicks * scoring.engagementWeights.emailClicks +
    behavioral.adInteractions * scoring.engagementWeights.adInteractions +
    behavioral.formSubmissions * scoring.engagementWeights.formSubmissions

  const behavioralScore = (engagementRaw / 200) * scoring.behavioralWeight
  const demographicScore =
    ((UNIT_BASE_SCORES[unitSegment] + ownerAdjustment + variability + recencyBonus) / 100) *
    scoring.demographicWeight
  const sourceWeight = source === 'Email' ? scoring.sourceWeights.email : scoring.sourceWeights.meta

  const rawScore = behavioralScore + demographicScore + sourceWeight * 0.15

  return toNumberInRange(Math.round(rawScore), 20, 100)
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

const buildNurturing = (status: LeadStatus, createdAtDate: Date): Lead['nurturing'] => {
  if (status !== 'Low Intent' && status !== 'Nurturing') {
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

const buildAutomation = (status: LeadStatus): Lead['automation'] => {
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

const buildRoutingDecision = (lead: Pick<Lead, 'status' | 'score' | 'source'>): Lead['routing'] => {
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
  lead: Pick<Lead, 'behavioral' | 'score' | 'status' | 'unitSegment'>,
): Lead['qualityInsight'] => {
  const reasons = [
    `${lead.behavioral.adInteractions} ad interactions`,
    `${lead.behavioral.emailOpens} email opens`,
    `${lead.behavioral.emailClicks} email clicks`,
    `${lead.unitSegment} portfolio segment`,
  ]

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
      unitSegment: lead.unitSegment,
      granularSegment: lead.granularSegment,
      unitCount: lead.unitCount,
      compliant: lead.compliance.compliant ? 'yes' : 'no',
      nurturingStage: lead.nurturing.stage,
      forecast7d: lead.forecast.day7,
      forecast14d: lead.forecast.day14,
      forecast30d: lead.forecast.day30,
    })),
  )

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

  const leads = metaRows.map((row) => {
    const id = row.id
    const createdAtDate = parseDate(row.created_time)
    const createdAt = createdAtDate.toISOString()
    const multifamilyOwner = toConsentValue(
      row['do_you_have_a_multifamily_unit_with_4+_rental_properties?'] ?? '',
    )
    const source = formatSource(row.platform ?? '')
    const unitSegment = formatUnits(row['how_many_total_units_do_you_have_across_your_properties?'])
    const behavioral = buildBehavioralSignals(id, source, createdAtDate)
    const score = getScore(
      id,
      source,
      unitSegment,
      behavioral,
      multifamilyOwner,
      createdAtDate,
      newestDate,
      scoring,
    )
    const optedOut = hashString(id) % 29 === 0
    const status = getStatus(score, multifamilyOwner, optedOut, scoring)
    const profileIndex = hashString(`${id}-${row.email}`) % cdpProfiles.length
    const matchedProfile = cdpProfiles[profileIndex] ?? null
    const unitCount = toUnitCount(unitSegment)
    const granularSegment = toGranularSegment(unitCount)
    const compliance = buildCompliance(multifamilyOwner, optedOut)
    const nurturing = buildNurturing(status, createdAtDate)
    const automation = buildAutomation(status)
    const routing = buildRoutingDecision({ status, score, source })
    const qualityInsight = buildQualityInsight({
      behavioral,
      score,
      status,
      unitSegment,
    })

    const activityTime = toDisplayTime(createdAtDate)

    return {
      id,
      createdAt,
      firstName: row.first_name ?? '',
      lastName: row.last_name ?? '',
      email: row.email ?? '',
      phone: normalizePhone(row.phone_number ?? ''),
      zipCode: normalizeZip(row.zip_code ?? ''),
      source,
      campaignName: row.campaign_name ?? 'Unknown campaign',
      unitSegment,
      granularSegment,
      unitCount,
      multifamilyOwner,
      behavioral,
      score,
      status,
      forecast: getForecast(score),
      tcpaConsentVerified: multifamilyOwner,
      optedOut,
      compliance,
      nurturing,
      automation,
      routing,
      qualityInsight,
      cdpProfile: score >= 60 || status === 'High Intent' ? matchedProfile : null,
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
          label: `Behavioral engagement · ${behavioral.emailOpens} opens, ${behavioral.emailClicks} clicks, ${behavioral.adInteractions} ad interactions`,
          timestamp: toDisplayTime(new Date(behavioral.lastEngagedAt)),
        },
      ],
    } satisfies Lead
  })

  return {
    leads,
    campaigns: toCampaignRows(leads),
  }
}
