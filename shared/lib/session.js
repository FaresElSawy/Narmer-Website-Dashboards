import { ApiError } from './api.js'

export const staffRoles = ['moderator', 'admin', 'superAdmin']
export const canUseDashboard = (user, store) =>
  user?.store === store && staffRoles.includes(user.role)
export const staffLanding = (store, role) =>
  store === 'b2b' ? 'requests' : role === 'moderator' ? 'orders' : 'overview'

export function createSession(store, { locks = globalThis.navigator?.locks, channel = null } = {}) {
  let state = { status: 'anonymous', user: null, accessToken: null },
    pending,
    generation = 0
  const listeners = new Set()
  const publish = () => listeners.forEach((listener) => listener())
  function clear(broadcast = true) {
    generation++
    state = { status: 'anonymous', user: null, accessToken: null }
    publish()
    if (broadcast) channel?.postMessage({ type: 'clear', store })
  }
  function accept(data) {
    if (
      data?.user?.store !== store ||
      !['user', ...staffRoles].includes(data.user.role) ||
      typeof data.user.id !== 'string' ||
      !data.user.id ||
      typeof data.user.name !== 'string' ||
      !data.user.name ||
      typeof data.accessToken !== 'string' ||
      !data.accessToken ||
      !Number.isFinite(data.expiresIn) ||
      data.expiresIn <= 0
    ) {
      throw new ApiError('INVALID_SESSION')
    }
    generation++
    state = { status: 'authenticated', user: data.user, accessToken: data.accessToken }
    publish()
  }
  const onMessage = (event) => {
    if (event.data?.store === store && event.data.type === 'clear') clear(false)
  }
  channel?.addEventListener('message', onMessage)
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    accept,
    clear,
    updateUser(user) {
      if (
        !state.user ||
        user?.id !== state.user.id ||
        user.store !== store ||
        user.role !== state.user.role ||
        typeof user.name !== 'string' ||
        !user.name
      )
        throw new ApiError('SESSION_CHANGED')
      state = { ...state, user }
      publish()
    },
    refresh(api) {
      if (pending) return pending
      const started = generation
      const run = async () => {
        if (generation !== started) throw new ApiError('SESSION_CHANGED')
        const data = await api.request('/auth/refresh', { method: 'POST' })
        if (generation !== started) throw new ApiError('SESSION_CHANGED')
        accept(data)
        return data
      }
      // shortcut: browsers without Web Locks serialize this tab only; live multi-tab acceptance requires Web Locks.
      pending = (locks ? locks.request(`narmer:${store}:refresh`, run) : run())
        .catch((error) => {
          if (error.status === 401 && generation === started) clear()
          throw error
        })
        .finally(() => {
          pending = undefined
        })
      return pending
    },
    async read(api, path, options = {}) {
      if (options.method && options.method !== 'GET')
        throw new TypeError('Automatic refresh/retry is restricted to reads')
      try {
        return await api.request(path, { ...options, authenticated: true })
      } catch (error) {
        if (error.status !== 401) throw error
        await this.refresh(api)
        return api.request(path, { ...options, authenticated: true })
      }
    },
    async logout(api) {
      const started = generation
      try {
        await api.request('/auth/logout', { method: 'POST', authenticated: true })
      } catch (error) {
        if (error.status !== 401) throw error
      }
      if (generation === started) clear()
    },
    dispose() {
      channel?.removeEventListener('message', onMessage)
      channel?.close()
      listeners.clear()
    },
  }
}
