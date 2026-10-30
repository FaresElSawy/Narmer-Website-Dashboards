import { ApiError } from '../../../../shared/lib/api.js'
import {
  createPrivateState,
  consumeTrackingFragment,
} from '../../../../shared/lib/private-state.js'
import {
  checkoutInput,
  checkoutOwner,
  emptyCheckout,
  orderIdValid,
  placementBody,
  trackingTokenValid,
  uncertainWrite,
} from './model.js'

const key = 'narmer:b2c:checkout'
const fresh = (owner, ready = true) => ({
  owner,
  ready,
  trackingRoute: null,
  form: emptyCheckout(),
  quote: null,
  proof: null,
  pending: null,
  orderId: null,
  receipt: null,
  uncertain: false,
  uploadUncertain: false,
  busy: false,
  error: null,
  storageWarning: false,
})

export function createCheckoutState({ api, session, storage, now = Date.now }) {
  let state = fresh(checkoutOwner(session.getSnapshot().user), false),
    generation = 0,
    locked = false
  const listeners = new Set(),
    access = new Map()
  const publish = (next) => {
    state = next
    listeners.forEach((fn) => fn())
  }
  const removeSaved = () => {
    try {
      storage?.removeItem(key)
    } catch {
      /* Memory state remains usable. */
    }
  }
  function persist() {
    if (!storage) {
      if (!state.storageWarning) publish({ ...state, storageWarning: true })
      return
    }
    try {
      // A pending placement can replay after quote expiry; retain it until reconciled or the tab closes.
      storage?.setItem(key, JSON.stringify({ ...state, receipt: null, error: null, busy: false }))
    } catch {
      publish({ ...state, storageWarning: true })
    }
  }
  function commit(next) {
    publish(next)
    persist()
  }
  function assertOwner() {
    if (!state.owner || state.owner !== checkoutOwner(session.getSnapshot().user))
      throw new ApiError('CHECKOUT_IDENTITY_CHANGED', { status: 409 })
  }
  async function run(operation) {
    if (locked) return null
    assertOwner()
    locked = true
    const started = generation
    publish({ ...state, busy: true, error: null })
    try {
      return await operation(() => started === generation)
    } catch (error) {
      if (started === generation) commit({ ...state, error })
      return null
    } finally {
      if (started === generation) {
        locked = false
        publish({ ...state, busy: false })
      }
    }
  }
  const controller = {
    getSnapshot: () => state,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    connect() {
      return session.subscribe(() => {
        const owner = checkoutOwner(session.getSnapshot().user)
        if (owner === state.owner) return
        generation++
        locked = false
        access.clear()
        removeSaved()
        publish(fresh(owner))
      })
    },
    restore() {
      const owner = checkoutOwner(session.getSnapshot().user)
      try {
        const saved = JSON.parse(storage?.getItem(key) || 'null')
        if (
          saved?.owner === owner &&
          saved.form &&
          orderIdValid(saved.quote?.checkoutId) &&
          (Date.parse(saved.quote.expiresAt) > now() || saved.pending) &&
          (!saved.pending ||
            (saved.pending.checkoutId === saved.quote.checkoutId &&
              (!saved.pending.proofId || saved.pending.proofId === saved.proof?.id))) &&
          (!saved.orderId || orderIdValid(saved.orderId))
        ) {
          checkoutInput(saved.form)
          publish({
            ...fresh(owner),
            ...saved,
            ready: true,
            busy: false,
            error: null,
            receipt: null,
          })
          return
        }
        removeSaved()
      } catch {
        try {
          storage?.removeItem(key)
        } catch {
          /* Memory state remains usable. */
        }
      }
      publish(fresh(owner))
    },
    update(form) {
      if (locked || state.pending || state.orderId) return false
      assertOwner()
      commit({ ...state, form, quote: null, proof: null, uploadUncertain: false, error: null })
      return true
    },
    edit() {
      if (locked || state.pending) return false
      commit({ ...state, quote: null, proof: null, uploadUncertain: false, error: null })
      return true
    },
    startNew() {
      if (locked || (state.pending && !state.orderId)) return false
      generation++
      removeSaved()
      publish(fresh(checkoutOwner(session.getSnapshot().user)))
      return true
    },
    preview(options = {}) {
      return run(async (active) => {
        if (state.pending || state.orderId)
          throw new ApiError('ORDER_REQUEST_CONFLICT', { status: 409 })
        const form = checkoutInput(state.form),
          owner = state.owner
        const quote = await api.preview(form, owner, options)
        if (!active()) return null
        if (
          !orderIdValid(quote?.checkoutId) ||
          !(Date.parse(quote.expiresAt) > now()) ||
          !Array.isArray(quote.items) ||
          !quote.totals ||
          quote.paymentMethod !== form.paymentMethod
        )
          throw new ApiError('INVALID_RESPONSE')
        commit({
          ...state,
          form: { ...form, couponCode: form.couponCode || '' },
          quote,
          proof: null,
          pending: null,
          uncertain: false,
          uploadUncertain: false,
        })
        return quote
      })
    },
    upload(file, options = {}) {
      return run(async (active) => {
        if (
          state.pending ||
          state.orderId ||
          state.quote?.paymentMethod !== 'instapay' ||
          !(Date.parse(state.quote.expiresAt) > now())
        )
          throw new ApiError('CHECKOUT_UNAVAILABLE', { status: 409 })
        commit({ ...state, proof: null, uploadUncertain: true })
        try {
          const proof = await api.upload(state.quote.checkoutId, file, state.owner, options)
          if (!active()) return null
          if (!orderIdValid(proof?.id)) throw new ApiError('INVALID_RESPONSE')
          commit({ ...state, proof, uploadUncertain: false })
          return proof
        } catch (error) {
          if (active()) commit({ ...state, uploadUncertain: uncertainWrite(error) })
          throw error
        }
      })
    },
    place(options = {}) {
      return run(async (active) => {
        const body = state.pending || placementBody(state.quote, state.proof)
        if (!state.pending && !(Date.parse(state.quote.expiresAt) > now()))
          throw new ApiError('CHECKOUT_UNAVAILABLE', { status: 409 })
        commit({ ...state, pending: body, uncertain: true })
        try {
          const result = await api.place(body, state.owner, options)
          if (!active()) return null
          if (!orderIdValid(result?.order?.id)) throw new ApiError('INVALID_RESPONSE')
          if (result.trackingToken)
            controller.rememberAccess(
              result.order.id,
              result.trackingToken,
              result.trackingExpiresAt,
            )
          commit({ ...state, orderId: result.order.id, receipt: result.order, uncertain: false })
          return result
        } catch (error) {
          if (active()) {
            const uncertain = uncertainWrite(error) || error.code === 'ORDER_REQUEST_CONFLICT'
            commit({
              ...state,
              pending: uncertain || error.status === 429 ? body : null,
              uncertain,
            })
          }
          throw error
        }
      })
    },
    rememberAccess(id, token, expiresAt) {
      if (!orderIdValid(id) || !trackingTokenValid(token)) return
      const previous = controller.access(id)
      const value =
        previous?.token === token && previous.expiresAt
          ? previous
          : {
              token,
              expiresAt: expiresAt || null,
              owner: checkoutOwner(session.getSnapshot().user),
            }
      access.set(id, value)
      if (Date.parse(value.expiresAt) > now()) {
        try {
          if (storage)
            createPrivateState(storage, 'b2c', now).save(
              `order:${id}`,
              value,
              Date.parse(value.expiresAt),
            )
        } catch {
          publish({ ...state, storageWarning: true })
        }
      }
    },
    visitTracking(routeKey, location, history, id) {
      const token = consumeTrackingFragment(location, history)
      if (orderIdValid(id) && trackingTokenValid(token)) controller.rememberAccess(id, token)
      publish({ ...state, trackingRoute: routeKey })
    },
    access(id) {
      let saved = access.get(id)
      if (!saved && storage) {
        try {
          saved = createPrivateState(storage, 'b2c', now).load(`order:${id}`)
        } catch {
          return null
        }
      }
      return saved?.token &&
        saved.owner === checkoutOwner(session.getSnapshot().user) &&
        (!saved.expiresAt || Date.parse(saved.expiresAt) > now())
        ? saved
        : null
    },
  }
  return controller
}
