import { createRetailFixture } from './fixtures.js'
import { ApiError } from '../../../../shared/lib/api.js'

export function createRetailApi({ config, api, session, images }) {
  if (config.mode === 'fixtures') return createRetailFixture(session, images)
  const customer = () => session.getSnapshot().user?.role === 'user'
  const requireShopper = () => {
    const user = session.getSnapshot().user
    if (user && (user.role !== 'user' || user.store !== 'b2c'))
      throw new ApiError('FORBIDDEN', { status: 403 })
  }
  let cooldown = 0
  async function write(path, options) {
    requireShopper()
    if (Date.now() < cooldown)
      throw new ApiError('TOO_MANY_REQUESTS', {
        status: 429,
        retryAfter: Math.ceil((cooldown - Date.now()) / 1000),
      })
    try {
      return await api.request(path, options)
    } catch (error) {
      if (error.status === 429 && error.retryAfter) cooldown = Date.now() + error.retryAfter * 1000
      throw error
    }
  }
  return {
    categories: (options) => api.request('/categories', options),
    homepage: (options) => api.request('/homepage', options),
    settings: (options) => api.request('/site-settings', options),
    products: (query, options) => api.request(`/products?${query}`, options),
    facets(query, options) {
      const filters = new URLSearchParams(query)
      for (const key of ['page', 'limit', 'sort']) filters.delete(key)
      return api.request(`/products/facets?${filters}`, options)
    },
    product: (id, options) => api.request(`/products/${encodeURIComponent(id)}`, options),
    cart: (guest = false, options = {}) => {
      requireShopper()
      return customer() && !guest
        ? session.read(api, '/cart', options)
        : api.request('/cart', { ...options, authenticated: false })
    },
    setQuantity: (body, guest = false, options = {}) =>
      write('/cart/items', {
        ...options,
        method: 'PUT',
        body,
        authenticated: customer() && !guest,
      }),
    merge: () => write('/cart/merge', { method: 'POST', authenticated: true }),
    wishlist: (options) => session.read(api, '/wishlist', options),
    save: (id, remove = false, options = {}) =>
      write(`/wishlist/items/${encodeURIComponent(id)}`, {
        ...options,
        method: remove ? 'DELETE' : 'PUT',
        authenticated: true,
      }),
  }
}
