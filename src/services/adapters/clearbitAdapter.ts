import { adapterEnv } from '../../config/env'
import { httpRequest } from './http'
import type { AdapterStatus, EnrichmentProfile } from './types'

interface ClearbitCompanyResponse {
  name?: string
  category?: { industry?: string }
  metrics?: { employees?: number }
  linkedin?: { handle?: string }
  domain?: string
}

export const getClearbitAdapterStatus = (): AdapterStatus => {
  const connected = Boolean(adapterEnv.clearbit.apiKey)
  return {
    key: 'clearbit',
    connected,
    message: connected ? 'Clearbit adapter configured' : 'Set VITE_CLEARBIT_API_KEY',
  }
}

export const fetchClearbitProfile = async (
  email: string,
): Promise<{ profile: EnrichmentProfile | null; status: AdapterStatus }> => {
  const status = getClearbitAdapterStatus()
  if (!status.connected || !email.includes('@')) {
    return { profile: null, status }
  }

  const domain = email.split('@')[1]
  const url = `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`
  const response = await httpRequest<ClearbitCompanyResponse>({
    url,
    token: adapterEnv.clearbit.apiKey,
  })

  const profile: EnrichmentProfile = {
    email,
    company: response.name,
    companySize:
      typeof response.metrics?.employees === 'number' ? String(response.metrics.employees) : undefined,
    industry: response.category?.industry,
    linkedinUrl: response.linkedin?.handle
      ? `https://www.linkedin.com/company/${response.linkedin.handle}`
      : undefined,
    domain: response.domain ?? domain,
    source: 'clearbit',
  }

  return { profile, status }
}
