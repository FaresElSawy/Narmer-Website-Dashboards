import { readConfig } from '../lib/config.js'

// Keep local integration cookies same-site; preserve the backend's cookie flags.
export function integrationProxy(mode, env, store) {
  if (mode !== 'integration') return {}
  const { apiOrigin } = readConfig(env, store)
  if (!apiOrigin) throw new Error('Integration preview requires the configured API origin')
  const forward = { target: apiOrigin, changeOrigin: true, secure: true },
    routes = { [`^/api/v1/(?:admin/)?${store}(?:/|$)`]: forward }
  if (store === 'b2b') routes['^/api/v1/b2c/products/'] = forward
  return routes
}
