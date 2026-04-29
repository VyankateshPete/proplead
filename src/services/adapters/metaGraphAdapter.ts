import { adapterEnv } from '../../config/env'
import { httpRequest } from './http'
import type { AdapterStatus, LeadIngestCandidate } from './types'

interface MetaLeadApiResponse {
  data?: Array<Record<string, unknown>>
}

interface MetaLeadField {
  name: string
  values?: string[]
}

const toLeadCandidate = (raw: Record<string, unknown>): LeadIngestCandidate => ({
  id: String(raw.id ?? ''),
  createdAt: String(raw.created_time ?? new Date().toISOString()),
  firstName: (() => {
    const field = ((raw.field_data as MetaLeadField[] | undefined) ?? []).find(
      (item) => item.name === 'first_name',
    )
    return String(field?.values?.[0] ?? '')
  })(),
  lastName: (() => {
    const field = ((raw.field_data as MetaLeadField[] | undefined) ?? []).find(
      (item) => item.name === 'last_name',
    )
    return String(field?.values?.[0] ?? '')
  })(),
  email: (() => {
    const field = ((raw.field_data as MetaLeadField[] | undefined) ?? []).find(
      (item) => item.name === 'email',
    )
    return String(field?.values?.[0] ?? '')
  })(),
  phone: (() => {
    const field = ((raw.field_data as MetaLeadField[] | undefined) ?? []).find(
      (item) => item.name === 'phone_number',
    )
    return String(field?.values?.[0] ?? '')
  })(),
  source: 'Meta',
  campaign: String(raw.campaign_name ?? 'Meta Campaign'),
  units: String(raw.units ?? ''),
})

export const getMetaAdapterStatus = (): AdapterStatus => {
  const connected = Boolean(
    adapterEnv.meta.accessToken && adapterEnv.meta.adAccountId && adapterEnv.meta.pageId,
  )
  return {
    key: 'meta',
    connected,
    message: connected
      ? 'Meta Graph adapter configured'
      : 'Set VITE_META_ACCESS_TOKEN, VITE_META_AD_ACCOUNT_ID, and VITE_META_PAGE_ID',
  }
}

export const fetchMetaLeadCandidates = async (
  limit = 25,
): Promise<{ leads: LeadIngestCandidate[]; status: AdapterStatus }> => {
  const status = getMetaAdapterStatus()
  if (!status.connected) {
    return { leads: [], status }
  }

  const url = `https://graph.facebook.com/${adapterEnv.meta.graphVersion}/${adapterEnv.meta.pageId}/leadgen_forms?fields=leads.limit(${limit}){id,created_time,field_data}`
  const response = await httpRequest<MetaLeadApiResponse>({
    url,
    token: adapterEnv.meta.accessToken,
  })

  const leads =
    response.data?.flatMap((form) => {
      const nested = (form.leads as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []
      return nested.map((item) => toLeadCandidate(item))
    }) ?? []

  return { leads, status }
}
