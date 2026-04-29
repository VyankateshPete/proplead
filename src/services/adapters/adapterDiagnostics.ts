import type { IntegrationConnection } from '../../types'
import { getActiveCampaignAdapterStatus } from './activeCampaignAdapter'
import { getClearbitAdapterStatus } from './clearbitAdapter'
import { getMailchimpAdapterStatus } from './mailchimpAdapter'
import { getMetaAdapterStatus } from './metaGraphAdapter'
import { getZoomInfoAdapterStatus } from './zoomInfoAdapter'

export const getAdapterBackedIntegrations = (): IntegrationConnection[] => {
  const metaStatus = getMetaAdapterStatus()
  const mailchimpStatus = getMailchimpAdapterStatus()
  const activeCampaignStatus = getActiveCampaignAdapterStatus()
  const clearbitStatus = getClearbitAdapterStatus()
  const zoomInfoStatus = getZoomInfoAdapterStatus()

  return [
    {
      key: 'salesforce',
      label: 'Salesforce',
      connected: true,
      statusText: 'Connected',
      lastSyncAt: '2m ago',
      category: 'CRM',
    },
    {
      key: 'hubspot',
      label: 'HubSpot',
      connected: false,
      statusText: 'Not connected',
      lastSyncAt: 'Never',
      category: 'CRM',
    },
    {
      key: 'meta',
      label: 'Meta Lead Gen API',
      connected: metaStatus.connected,
      statusText: metaStatus.connected ? 'Configured' : 'Missing env vars',
      lastSyncAt: metaStatus.connected ? 'Ready' : 'Never',
      category: 'Advertising',
    },
    {
      key: 'mailchimp',
      label: 'Mailchimp',
      connected: mailchimpStatus.connected,
      statusText: mailchimpStatus.connected ? 'Configured' : 'Missing env vars',
      lastSyncAt: mailchimpStatus.connected ? 'Ready' : 'Never',
      category: 'Email',
    },
    {
      key: 'activecampaign',
      label: 'ActiveCampaign',
      connected: activeCampaignStatus.connected,
      statusText: activeCampaignStatus.connected ? 'Configured' : 'Missing env vars',
      lastSyncAt: activeCampaignStatus.connected ? 'Ready' : 'Never',
      category: 'Email',
    },
    {
      key: 'zoho',
      label: 'Zoho CRM',
      connected: false,
      statusText: 'Optional',
      lastSyncAt: 'Never',
      category: 'CRM',
    },
    {
      key: 'pipedrive',
      label: 'Pipedrive',
      connected: false,
      statusText: 'Optional',
      lastSyncAt: 'Never',
      category: 'CRM',
    },
    {
      key: 'clearbit',
      label: 'Clearbit',
      connected: clearbitStatus.connected,
      statusText: clearbitStatus.connected ? 'Configured' : 'Missing env vars',
      lastSyncAt: clearbitStatus.connected ? 'Ready' : 'Never',
      category: 'Enrichment',
    },
    {
      key: 'zoominfo',
      label: 'ZoomInfo',
      connected: zoomInfoStatus.connected,
      statusText: zoomInfoStatus.connected ? 'Configured' : 'Missing env vars',
      lastSyncAt: zoomInfoStatus.connected ? 'Ready' : 'Never',
      category: 'Enrichment',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn Enrichment',
      connected: true,
      statusText: 'Connected',
      lastSyncAt: '8m ago',
      category: 'Enrichment',
    },
  ]
}
