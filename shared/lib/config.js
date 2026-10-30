export function readConfig(env, store) {
  if (!['b2b', 'b2c'].includes(store)) throw new Error('Invalid store')
  const mode = env.VITE_DATA_MODE || 'unconfigured'
  if (!['fixtures', 'live', 'unconfigured'].includes(mode)) throw new Error('Invalid data mode')
  const origin = (env.VITE_API_ORIGIN || '').trim()
  const siteOrigin = (env.VITE_SITE_ORIGIN || '').trim()
  for (const value of [origin, siteOrigin].filter(Boolean)) {
    const url = new URL(value)
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('Configure an HTTP(S) origin without a path, credentials, query or fragment')
    }
  }
  return {
    store,
    mode,
    apiOrigin:
      mode === 'live' &&
      origin &&
      env.SSR === false &&
      globalThis.location?.origin &&
      (env.VITE_API_SAME_ORIGIN === 'true' ||
        (env.MODE === 'integration' &&
          ['127.0.0.1', 'localhost', '[::1]'].includes(globalThis.location.hostname)))
        ? globalThis.location.origin
        : origin.replace(/\/$/, ''),
    siteOrigin: siteOrigin.replace(/\/$/, ''),
    review: mode !== 'live',
  }
}
