import { adapterEnv } from '../../config/env'

type Method = 'GET' | 'POST'

interface HttpRequestArgs {
  url: string
  method?: Method
  token?: string
  body?: unknown
  headers?: Record<string, string>
}

export const withProxy = (url: string): string => {
  if (!adapterEnv.proxyBaseUrl) {
    return url
  }

  const encoded = encodeURIComponent(url)
  return `${adapterEnv.proxyBaseUrl}/proxy?url=${encoded}`
}

export const httpRequest = async <T>({
  url,
  method = 'GET',
  token,
  body,
  headers = {},
}: HttpRequestArgs): Promise<T> => {
  const requestHeaders: Record<string, string> = {
    ...headers,
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(withProxy(url), {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`)
  }

  return (await response.json()) as T
}
