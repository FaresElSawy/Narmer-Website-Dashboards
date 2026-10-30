import { ApiError } from '../../../../shared/lib/api.js'
import { staffAccess } from './model.js'
import { createStaffFixture } from './fixtures.js'
import { reviewInquiry } from '../inquiry/api.js'
import { reviewImages } from '../inquiry/review-images.js'

const fixtures = new WeakMap()
const pausedUntil = new WeakMap()
export function createDashboardApi(runtime, user, language) {
  const { config, api, session } = runtime
  if (config.mode === 'fixtures' && !fixtures.has(session))
    fixtures.set(session, createStaffFixture(reviewInquiry(session, reviewImages).staffData))
  return async (path, { method = 'GET', ...options } = {}) => {
    if (!staffAccess(user.role, path, method)) throw new ApiError('FORBIDDEN', { status: 403 })
    const assertOwner = () => {
      if (config.mode === 'fixtures') return
      const current = session.getSnapshot().user
      if (current?.id !== user.id || current?.role !== user.role || current?.store !== 'b2b')
        throw new ApiError('SESSION_CHANGED', { status: 401 })
    }
    assertOwner()
    const remaining = Math.ceil(((pausedUntil.get(session) || 0) - Date.now()) / 1000)
    if (remaining > 0)
      throw new ApiError('TOO_MANY_REQUESTS', { status: 429, retryAfter: remaining })
    const admin = path !== '/users/me' && path !== '/auth/change-password'
    let result
    try {
      result =
        config.mode === 'fixtures'
          ? await fixtures.get(session)(path, { method, ...options, user, language })
          : method === 'GET'
            ? await session.read(api, path, { ...options, admin, language })
            : await api.request(path, { ...options, method, admin, authenticated: true, language })
    } catch (error) {
      if (method !== 'GET' && error.status === 401 && config.mode === 'live') {
        await session.refresh(api)
        assertOwner()
        throw new ApiError('SESSION_REFRESHED', { status: 401 })
      }
      if (error.status === 429)
        pausedUntil.set(session, Date.now() + (error.retryAfter ?? 30) * 1000)
      throw error
    }
    assertOwner()
    if (method === 'PATCH' && ['/homepage', '/site-settings'].includes(path))
      runtime.invalidatePublicContent?.()
    return result
  }
}
