const asString = (value: string | undefined): string => value?.trim() ?? ''

const asOptionalBaseUrl = (value: string | undefined): string => {
  const normalized = asString(value).replace(/\/+$/, '')
  return normalized
}

export interface AdapterEnvConfig {
  proxyBaseUrl: string
  meta: {
    graphVersion: string
    accessToken: string
    adAccountId: string
    pageId: string
  }
  mailchimp: {
    apiKey: string
    serverPrefix: string
    audienceId: string
  }
  activeCampaign: {
    baseUrl: string
    apiKey: string
  }
  clearbit: {
    apiKey: string
  }
  zoomInfo: {
    baseUrl: string
    apiKey: string
  }
}

export const adapterEnv: AdapterEnvConfig = {
  proxyBaseUrl: asOptionalBaseUrl(import.meta.env.VITE_ADAPTER_PROXY_BASE_URL),
  meta: {
    graphVersion: asString(import.meta.env.VITE_META_GRAPH_VERSION) || 'v20.0',
    accessToken: asString(import.meta.env.VITE_META_ACCESS_TOKEN),
    adAccountId: asString(import.meta.env.VITE_META_AD_ACCOUNT_ID),
    pageId: asString(import.meta.env.VITE_META_PAGE_ID),
  },
  mailchimp: {
    apiKey: asString(import.meta.env.VITE_MAILCHIMP_API_KEY),
    serverPrefix: asString(import.meta.env.VITE_MAILCHIMP_SERVER_PREFIX),
    audienceId: asString(import.meta.env.VITE_MAILCHIMP_AUDIENCE_ID),
  },
  activeCampaign: {
    baseUrl: asOptionalBaseUrl(import.meta.env.VITE_ACTIVECAMPAIGN_BASE_URL),
    apiKey: asString(import.meta.env.VITE_ACTIVECAMPAIGN_API_KEY),
  },
  clearbit: {
    apiKey: asString(import.meta.env.VITE_CLEARBIT_API_KEY),
  },
  zoomInfo: {
    baseUrl: asOptionalBaseUrl(import.meta.env.VITE_ZOOMINFO_BASE_URL),
    apiKey: asString(import.meta.env.VITE_ZOOMINFO_API_KEY),
  },
}

