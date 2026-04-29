import { adapterEnv } from '../../config/env'
import { httpRequest } from './http'
import type { AdapterStatus, EnrichmentProfile } from './types'

interface ZoomInfoResponse {
  data?: Array<Record<string, unknown>>
}

export const getZoomInfoAdapterStatus = (): AdapterStatus => {
  const connected = Boolean(adapterEnv.zoomInfo.baseUrl && adapterEnv.zoomInfo.apiKey)
  return {
    key: 'zoominfo',
    connected,
    message: connected
      ? 'ZoomInfo adapter configured'
      : 'Set VITE_ZOOMINFO_BASE_URL and VITE_ZOOMINFO_API_KEY',
  }
}

export const fetchZoomInfoProfile = async (
  email: string,
): Promise<{ profile: EnrichmentProfile | null; status: AdapterStatus }> => {
  const status = getZoomInfoAdapterStatus()
  if (!status.connected) {
    return { profile: null, status }
  }

  const url = `${adapterEnv.zoomInfo.baseUrl}/lookup?email=${encodeURIComponent(email)}`
  const response = await httpRequest<ZoomInfoResponse>({
    url,
    headers: {
      'X-Api-Key': adapterEnv.zoomInfo.apiKey,
    },
  })

  const profileRow = response.data?.[0]
  if (!profileRow) {
    return { profile: null, status }
  }

  return {
    profile: {
      email,
      company: String(profileRow.companyName ?? ''),
      companySize: String(profileRow.employeeCount ?? ''),
      industry: String(profileRow.industry ?? ''),
      linkedinUrl: String(profileRow.linkedinUrl ?? ''),
      domain: String(profileRow.domain ?? ''),
      source: 'zoominfo',
    },
    status,
  }
}
