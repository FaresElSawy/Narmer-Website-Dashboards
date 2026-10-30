export class ApiError extends Error {
  constructor(
    code,
    { status = 0, message = code, errors = [], requestId = null, retryAfter = null } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    Object.assign(this, { code, status, errors, requestId, retryAfter })
  }
}

export function retryDelay(value, now = Date.now()) {
  if (!value) return null
  const seconds = /^\d+$/.test(value) ? Number(value) : (Date.parse(value) - now) / 1000
  return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : null
}

export function createApi(
  { apiOrigin, store, mode },
  { fetcher = globalThis.fetch, getToken = () => null, getLanguage = () => 'en' } = {},
) {
  async function request(
    path,
    {
      method = 'GET',
      body,
      headers: extraHeaders,
      signal,
      admin = false,
      authenticated = false,
      binary = false,
      language = getLanguage(),
    } = {},
  ) {
    if (mode !== 'live' || !apiOrigin) throw new ApiError('API_UNCONFIGURED')
    if (!/^\/[a-zA-Z0-9/_-]*(?:\?[^#]*)?$/.test(path) || path.includes('..'))
      throw new TypeError('Use a store-relative API path')
    const headers = new Headers(extraHeaders)
    headers.set('X-Language', language)
    const token = getToken()
    if (authenticated && !token) throw new ApiError('UNAUTHORIZED', { status: 401 })
    if (authenticated && token) headers.set('Authorization', `Bearer ${token}`)
    if (body !== undefined && !(body instanceof Blob))
      headers.set('Content-Type', 'application/json')
    let response
    try {
      response = await fetcher(`${apiOrigin}/api/v1/${admin ? 'admin/' : ''}${store}${path}`, {
        method,
        headers,
        credentials: 'include',
        cache: 'no-store',
        signal,
        body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body),
      })
    } catch (error) {
      if (error.name === 'AbortError') throw error
      throw new ApiError('NETWORK_ERROR')
    }
    const details = {
      status: response.status,
      requestId: response.headers.get('X-Request-Id'),
      retryAfter: retryDelay(response.headers.get('Retry-After')),
    }
    if (binary && response.ok) {
      if (!/^image\/(jpeg|png|webp)(?:;|$)/i.test(response.headers.get('Content-Type') || ''))
        throw new ApiError('INVALID_BINARY', details)
      return response.blob()
    }
    let envelope
    try {
      envelope = await response.json()
    } catch {
      throw new ApiError('INVALID_RESPONSE', details)
    }
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope))
      throw new ApiError('INVALID_RESPONSE', details)
    if (!response.ok || envelope.success !== true) {
      throw new ApiError(envelope.code || 'INVALID_RESPONSE', {
        ...details,
        message: envelope.message,
        errors: Array.isArray(envelope.errors) ? envelope.errors : [],
        requestId: envelope.requestId || details.requestId,
      })
    }
    if (!Object.hasOwn(envelope, 'data') || typeof envelope.code !== 'string')
      throw new ApiError('INVALID_RESPONSE', details)
    return envelope.data
  }
  return { request }
}

// Each feature owns its reads; abort the previous request and discard late results.
export function latestRead() {
  let controller,
    sequence = 0
  return {
    async run(read, commit) {
      controller?.abort()
      controller = new AbortController()
      const current = ++sequence
      try {
        const result = await read(controller.signal)
        if (current === sequence) commit(result)
      } catch (error) {
        if (current === sequence && error.name !== 'AbortError') throw error
      }
    },
    cancel() {
      sequence++
      controller?.abort()
    },
  }
}
