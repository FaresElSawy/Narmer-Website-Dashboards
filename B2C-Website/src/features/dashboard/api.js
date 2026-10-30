import { ApiError } from '../../../../shared/lib/api.js'
import { dashboardAccess } from './model.js'
import { createDashboardFixture } from './fixtures.js'

const fixtures = new WeakMap(),
  pausedUntil = new WeakMap()
export function createDashboardApi(runtime, user, language, reportStore) {
  const { config, api, session } = runtime
  if (config.mode === 'fixtures' && !fixtures.has(session))
    fixtures.set(session, createDashboardFixture())
  return async (path, { method = 'GET', ...options } = {}) => {
    if (!dashboardAccess(user.role, path, method)) throw new ApiError('FORBIDDEN', { status: 403 })
    const assertOwner = () => {
      if (config.mode === 'fixtures') return
      const current = session.getSnapshot().user
      if (current?.id !== user.id || current?.role !== user.role || current?.store !== 'b2c')
        throw new ApiError('SESSION_CHANGED', { status: 401 })
    }
    assertOwner()
    const remaining = Math.ceil(((pausedUntil.get(session) || 0) - Date.now()) / 1000)
    if (remaining > 0)
      throw new ApiError('TOO_MANY_REQUESTS', { status: 429, retryAfter: remaining })
    const admin = path !== '/users/me' && path !== '/auth/change-password'
    if (reportStore && method === 'PATCH' && /^\/orders\/[a-f0-9]{24}\/status$/.test(path)) {
      reportStore.epoch++
      reportStore.cache.clear()
    }
    let result
    try {
      result =
        config.mode === 'fixtures'
          ? await fixtures.get(session)(path, { method, ...options, user, language })
          : method === 'GET'
            ? await session.read(api, path, { ...options, admin, language })
            : await api.request(path, { ...options, method, admin, authenticated: true, language })
    } catch (error) {
      if (
        method === 'GET' &&
        path.startsWith('/reports/') &&
        error.status === 403 &&
        config.mode === 'live'
      ) {
        await session.refresh(api).catch(() => {})
      }
      if (method !== 'GET' && error.status === 401 && config.mode === 'live') {
        await session.refresh(api)
        assertOwner()
        throw new ApiError('SESSION_REFRESHED', { status: 401 })
      }
      if (error.status === 429 && !path.startsWith('/reports/'))
        pausedUntil.set(session, Date.now() + (error.retryAfter ?? 30) * 1000)
      throw error
    }
    assertOwner()
    if (method === 'PATCH' && ['/homepage', '/site-settings'].includes(path))
      runtime.invalidatePublicContent?.()
    return result
  }
}
