import { ApiError } from '../../../../shared/lib/api.js'
import { imageUploadBody } from '../../../../shared/lib/image-upload.js'
import { createOrdersFixture } from './fixtures.js'

export function createOrdersApi({ config, api, session, retail }) {
  if (config.mode === 'fixtures') return createOrdersFixture({ session, retail })
  let cooldown = 0
  const snapshot = () => session.getSnapshot()
  const check = (owner) => {
    const user = snapshot().user
    const valid =
      owner === 'guest' ? !user : user?.id === owner && user.role === 'user' && user.store === 'b2c'
    if (!valid) throw new ApiError('CHECKOUT_IDENTITY_CHANGED', { status: 409 })
  }
  const guardOwner = (owner) => {
    if (owner === 'guest') {
      if (snapshot().user) throw new ApiError('FORBIDDEN', { status: 403 })
    } else if (
      snapshot().user?.id !== owner ||
      snapshot().user?.role !== 'user' ||
      snapshot().user?.store !== 'b2c'
    ) {
      throw new ApiError('FORBIDDEN', { status: 403 })
    }
  }
  const guestOptions = (options) => {
    const headers = new Headers(options.headers)
    headers.delete('Authorization')
    return { ...options, headers }
  }
  async function mutate(path, body, owner, options = {}, method = 'POST') {
    guardOwner(owner)
    if (Date.now() < cooldown)
      throw new ApiError('TOO_MANY_REQUESTS', {
        status: 429,
        retryAfter: Math.ceil((cooldown - Date.now()) / 1000),
      })
    try {
      const result = await api.request(path, {
        ...(owner === 'guest' ? guestOptions(options) : options),
        method,
        body,
        authenticated: owner !== 'guest',
      })
      check(owner)
      return result
    } catch (error) {
      if (error.status === 429 && error.retryAfter) cooldown = Date.now() + error.retryAfter * 1000
      if (error.code === 'CHECKOUT_IDENTITY_CHANGED' || error.code === 'FORBIDDEN') throw error
      check(owner)
      throw error
    }
  }
  const pathId = (id) => encodeURIComponent(id)
  async function accountRead(owner, path, options) {
    const guarded = {
      request: async (...args) => {
        check(owner)
        const result = await api.request(...args)
        check(owner)
        return result
      },
    }
    check(owner)
    try {
      const result = await session.read(guarded, path, options)
      check(owner)
      return result
    } catch (error) {
      check(owner)
      throw error
    }
  }
  const privateRead = (path, owner, token, options, binary = false) => {
    if (owner !== 'guest') check(owner)
    const requestOptions = owner === 'guest' ? guestOptions(options || {}) : options || {}
    const headers = new Headers(requestOptions.headers)
    if (token) headers.set('X-Order-Token', token)
    const request =
      owner === 'guest'
        ? api.request(path, {
            ...requestOptions,
            headers,
            authenticated: owner !== 'guest',
            binary,
          })
        : accountRead(owner, path, { ...requestOptions, headers, binary })
    return owner === 'guest'
      ? request
      : request.then(
          (value) => {
            check(owner)
            return value
          },
          (error) => {
            check(owner)
            throw error
          },
        )
  }
  return {
    shippingFees: (options = {}) => api.request(`/shipping-fees?page=1&limit=100`, options),
    shippingQuote: (code, options = {}) =>
      api.request(
        `/shipping-fees/quote?${new URLSearchParams({ governorateCode: code })}`,
        options,
      ),
    coupon: (body, owner, options = {}) => mutate('/cart/coupon-preview', body, owner, options),
    preview: (body, owner, options = {}) => mutate('/cart/checkout', body, owner, options),
    async upload(checkoutId, file, owner, options = {}) {
      const body = await imageUploadBody(file)
      const headers = new Headers(options.headers)
      headers.set('Content-Type', body.type)
      return mutate(`/cart/checkout/${pathId(checkoutId)}/proof`, body, owner, {
        ...options,
        headers,
      })
    },
    place: (body, owner, options = {}) => mutate('/cart/checkout/orders', body, owner, options),
    orders(query = '', options = {}) {
      const user = snapshot().user
      if (user?.role !== 'user' || user.store !== 'b2c')
        throw new ApiError('FORBIDDEN', { status: 403 })
      return accountRead(user.id, `/orders${query ? `?${query}` : ''}`, options)
    },
    order(id, { token, ...options } = {}) {
      if (token) return privateRead(`/orders/tracking/${pathId(id)}`, 'guest', token, options)
      const user = snapshot().user
      if (user?.role !== 'user' || user.store !== 'b2c')
        throw new ApiError('FORBIDDEN', { status: 403 })
      return privateRead(`/orders/${pathId(id)}`, user.id, null, options)
    },
    proof(id, { token, ...options } = {}) {
      if (token)
        return privateRead(`/orders/tracking/${pathId(id)}/proof`, 'guest', token, options, true)
      const user = snapshot().user
      if (user?.role !== 'user' || user.store !== 'b2c')
        throw new ApiError('FORBIDDEN', { status: 403 })
      return privateRead(`/orders/${pathId(id)}/proof`, user.id, null, options, true)
    },
  }
}
