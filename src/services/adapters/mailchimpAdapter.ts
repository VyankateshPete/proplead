import { adapterEnv } from '../../config/env'
import { httpRequest } from './http'
import type { AdapterStatus, EmailEngagementEvent } from './types'

interface MailchimpCampaignsResponse {
  campaigns?: Array<{
    id: string
    settings?: {
      title?: string
      subject_line?: string
    }
    report_summary?: {
      opens?: number
      clicks?: number
    }
  }>
}

export const getMailchimpAdapterStatus = (): AdapterStatus => {
  const connected = Boolean(
    adapterEnv.mailchimp.apiKey &&
      adapterEnv.mailchimp.serverPrefix &&
      adapterEnv.mailchimp.audienceId,
  )
  return {
    key: 'mailchimp',
    connected,
    message: connected
      ? 'Mailchimp adapter configured'
      : 'Set VITE_MAILCHIMP_API_KEY, VITE_MAILCHIMP_SERVER_PREFIX, and VITE_MAILCHIMP_AUDIENCE_ID',
  }
}

export const fetchMailchimpEngagement = async (
  limit = 10,
): Promise<{ events: EmailEngagementEvent[]; status: AdapterStatus }> => {
  const status = getMailchimpAdapterStatus()
  if (!status.connected) {
    return { events: [], status }
  }

  const url = `https://${adapterEnv.mailchimp.serverPrefix}.api.mailchimp.com/3.0/campaigns?count=${limit}&status=sent`
  const response = await httpRequest<MailchimpCampaignsResponse>({
    url,
    headers: {
      Authorization: `Basic ${btoa(`any:${adapterEnv.mailchimp.apiKey}`)}`,
    },
  })

  const now = new Date().toISOString()
  const events =
    response.campaigns?.map((campaign) => ({
      leadEmail: '',
      opened: (campaign.report_summary?.opens ?? 0) > 0,
      clicked: (campaign.report_summary?.clicks ?? 0) > 0,
      timestamp: now,
      campaignName:
        campaign.settings?.title || campaign.settings?.subject_line || `Campaign ${campaign.id}`,
    })) ?? []

  return { events, status }
}
