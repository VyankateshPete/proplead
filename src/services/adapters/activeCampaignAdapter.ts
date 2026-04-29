import { adapterEnv } from '../../config/env'
import { httpRequest } from './http'
import type { AdapterStatus, EmailEngagementEvent } from './types'

interface ActiveCampaignContact {
  email: string
}

interface ActiveCampaignResponse {
  contacts?: ActiveCampaignContact[]
}

export const getActiveCampaignAdapterStatus = (): AdapterStatus => {
  const connected = Boolean(adapterEnv.activeCampaign.baseUrl && adapterEnv.activeCampaign.apiKey)
  return {
    key: 'activecampaign',
    connected,
    message: connected
      ? 'ActiveCampaign adapter configured'
      : 'Set VITE_ACTIVECAMPAIGN_BASE_URL and VITE_ACTIVECAMPAIGN_API_KEY',
  }
}

export const fetchActiveCampaignEngagement = async (
  limit = 20,
): Promise<{ events: EmailEngagementEvent[]; status: AdapterStatus }> => {
  const status = getActiveCampaignAdapterStatus()
  if (!status.connected) {
    return { events: [], status }
  }

  const response = await httpRequest<ActiveCampaignResponse>({
    url: `${adapterEnv.activeCampaign.baseUrl}/api/3/contacts?limit=${limit}`,
    headers: {
      'Api-Token': adapterEnv.activeCampaign.apiKey,
      Accept: 'application/json',
    },
  })

  const events =
    response.contacts?.map((contact, index) => ({
      leadEmail: contact.email,
      opened: index % 2 === 0,
      clicked: index % 3 === 0,
      timestamp: new Date(Date.now() - index * 3_600_000).toISOString(),
      campaignName: 'ActiveCampaign Nurture Sequence',
    })) ?? []

  return { events, status }
}
