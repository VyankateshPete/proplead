import Papa from 'papaparse'
import type { CampaignRow, CDPProfile, Lead, LeadSource, LeadStatus, UnitSegment } from '../types'

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

const getScore = (
  leadId: string,
  source: LeadSource,
  unitSegment: UnitSegment,
  multifamilyOwner: boolean,
  createdAt: Date,
  newestDate: Date,
): number => {
  const variability = (hashString(leadId) % 7) - 3
  const platformBonus = source === 'Meta - Instagram' ? 1 : 0
  const ownerAdjustment = multifamilyOwner ? 4 : -6
  const dayDiff = Math.max(0, (newestDate.getTime() - createdAt.getTime()) / 86_400_000)
  const recencyBonus = Math.max(0, 4 - dayDiff * 0.2)

  const rawScore =
    UNIT_BASE_SCORES[unitSegment] + ownerAdjustment + platformBonus + variability + recencyBonus

  return toNumberInRange(Math.round(rawScore), 20, 100)
}

const getForecast = (score: number): Lead['forecast'] => ({
  day7: toNumberInRange(Math.round(score - 27), 8, 95),
  day14: toNumberInRange(Math.round(score - 14), 12, 97),
  day30: toNumberInRange(Math.round(score - 4), 18, 99),
})

const getStatus = (score: number, multifamilyOwner: boolean, optedOut: boolean): LeadStatus => {
  if (optedOut) return 'Opted Out'
  if (!multifamilyOwner && score < 35) return 'Low Intent'
  if (score >= 90) return 'High Intent'
  if (score >= 65) return 'Qualified'
  if (score >= 40) return 'Nurturing'
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

export const loadLeadData = async (): Promise<{ leads: Lead[]; campaigns: CampaignRow[] }> => {
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
    const multifamilyOwner =
      row['do_you_have_a_multifamily_unit_with_4+_rental_properties?']?.toLowerCase() === 'yes'
    const source = formatSource(row.platform ?? '')
    const unitSegment = formatUnits(row['how_many_total_units_do_you_have_across_your_properties?'])
    const score = getScore(id, source, unitSegment, multifamilyOwner, createdAtDate, newestDate)
    const optedOut = false
    const status = getStatus(score, multifamilyOwner, optedOut)
    const profileIndex = hashString(`${id}-${row.email}`) % cdpProfiles.length
    const matchedProfile = cdpProfiles[profileIndex] ?? null

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
      multifamilyOwner,
      score,
      status,
      forecast: getForecast(score),
      tcpaConsentVerified: multifamilyOwner,
      optedOut,
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
      ],
    } satisfies Lead
  })

  return {
    leads,
    campaigns: toCampaignRows(leads),
  }
}
