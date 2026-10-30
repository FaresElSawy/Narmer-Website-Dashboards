import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { useRuntime, useSession } from '../../../../shared/ui/Runtime.jsx'
import { createPrivateState } from '../../../../shared/lib/private-state.js'
import { ApiError } from '../../../../shared/lib/api.js'
import { imageUploadBody } from '../../../../shared/lib/image-upload.js'
import { createInquiryApi } from './api.js'
import {
  emptyContact,
  formTypes,
  isId,
  isSecret,
  mergeReceipt,
  requestOwner,
  reconcileUpload,
  submissionPayload,
} from './model.js'
import logo from '../../../../shared/assets/images/offer-logo.webp'
import quarter from '../../../../shared/assets/images/offer-quarter.webp'
import men from '../../../../shared/assets/images/campaign-men.webp'
import women from '../../../../shared/assets/images/campaign-women.webp'

const InquiryContext = createContext(null)
const freshState = (type = 'fabric', contact = emptyContact()) => ({
  type,
  contact,
  answers: {},
  form: null,
  draft: null,
  owner: null,
  images: [],
  selections: [],
  pending: null,
  receipt: null,
  uploadBefore: null,
  needsReview: false,
})
const storage = () => {
  try {
    return createPrivateState(sessionStorage, 'b2b')
  } catch {
    return null
  }
}

export function InquiryProvider({ children, publicData }) {
  const runtime = useRuntime(),
    auth = useSession(),
    language = useLocale()
  const { api: client, session, config } = runtime
  const api = useMemo(
    () =>
      createInquiryApi({ api: client, session, config }, () => language, {
        logo,
        quarter,
        men,
        women,
      }),
    [client, session, config, language],
  )
  const [state, setState] = useState(freshState),
    [forms, setForms] = useState(publicData?.forms?.items || []),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(false),
    [retryAt, setRetryAt] = useState(0)
  const access = useMemo(
    () => ({
      tracking: (leadId) => storage()?.load(`lead:${leadId}`),
      forgetTracking: (leadId) => storage()?.forget(`lead:${leadId}`),
      saveTracking: (leadId, token, expiresAt) => {
        try {
          storage()?.save(`lead:${leadId}`, { token, expiresAt }, Date.parse(expiresAt))
        } catch {
          /* The current page keeps access in memory. */
        }
      },
    }),
    [],
  )
  const stateRef = useRef(state),
    prepareRef = useRef(null),
    generation = useRef(0),
    identity = useRef(undefined)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  useEffect(() => {
    if (runtime.restoring) return
    const saved = storage()?.load('inquiry')
    if (
      saved &&
      formTypes.includes(saved.type) &&
      saved.contact &&
      saved.answers &&
      isId(saved.draft?.draftId) &&
      isSecret(saved.draft?.draftToken) &&
      Array.isArray(saved.images) &&
      saved.images.length <= 5 &&
      saved.images.every((image) => isId(image.id)) &&
      Array.isArray(saved.selections) &&
      saved.selections.length <= 10 &&
      (saved.owner === null || saved.owner === requestOwner(runtime.session.getSnapshot().user))
    )
      setState({ ...freshState(), ...saved })
    else storage()?.forget('inquiry')
    setReady(true)
  }, [runtime.session, runtime.restoring])
  useEffect(() => {
    if (!ready || !state.draft || state.receipt || state.owner !== requestOwner(auth.user)) return
    try {
      storage()?.save('inquiry', state, Date.parse(state.draft.expiresAt))
    } catch {
      /* The form remains usable in memory when tab storage is unavailable. */
    }
  }, [ready, state, auth.user])
  useEffect(() => {
    if (!ready || runtime.restoring) return
    const current = auth.user ? `${auth.user.id}:${auth.user.role}` : null
    if (identity.current === undefined) {
      identity.current = current
      return
    }
    if (identity.current !== current) {
      identity.current = current
      // Logout/account switching must clear private snapshots, including unresolved requests.
      generation.current++
      prepareRef.current = null
      storage()?.forget('inquiry')
      setBusy(false)
      setError(null)
      setState((current) => ({ ...freshState(current.type), form: current.form }))
    }
  }, [auth.user, ready, runtime.restoring])
  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    api
      .forms(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setForms(result.items)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason)
      })
    return () => controller.abort()
  }, [api, ready])
  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    setLoading(true)
    api
      .form(state.type, controller.signal)
      .then((form) => {
        if (controller.signal.aborted) return
        setState((current) =>
          current.pending
            ? current
            : {
                ...current,
                form,
                needsReview:
                  current.needsReview ||
                  Boolean(current.form && current.form.version !== form.version),
              },
        )
        setLoading(false)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason)
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [api, ready, state.type])
  useEffect(() => {
    if (!retryAt) return
    const timer = setTimeout(() => setRetryAt(0), Math.max(0, retryAt - Date.now()))
    return () => clearTimeout(timer)
  }, [retryAt])

  function report(reason) {
    setError(reason)
    if (reason.status === 429) setRetryAt(Date.now() + (reason.retryAfter ?? 30) * 1000)
  }
  async function ensureDraft() {
    const current = stateRef.current
    if (current.draft) return current.draft
    if (prepareRef.current) return prepareRef.current
    const owner = requestOwner(runtime.session.getSnapshot().user),
      started = generation.current
    prepareRef.current = api
      .prepare(current.type, owner)
      .then((draft) => {
        if (started !== generation.current) throw new ApiError('SESSION_CHANGED')
        setState((value) => ({ ...value, draft, owner }))
        return draft
      })
      .finally(() => {
        if (started === generation.current) prepareRef.current = null
      })
    return prepareRef.current
  }
  function update(update) {
    if (state.pending || state.receipt) return
    setState((current) => ({
      ...current,
      ...update,
      contact: { ...current.contact, ...update.contact },
      answers: { ...current.answers, ...update.answers },
    }))
    if (!state.draft && !retryAt) ensureDraft().catch(report)
  }
  function changeType(type) {
    if (!formTypes.includes(type) || state.pending) return false
    if (type === state.type && !state.receipt) return true
    if (
      !state.receipt &&
      (state.images.length || Object.keys(state.answers).length) &&
      !window.confirm(
        language === 'ar'
          ? 'تغيير الخدمة يبدأ مسودة جديدة. تبقى بيانات التواصل، ولا تنتقل الإجابات والصور. هل تريد المتابعة؟'
          : 'Changing service starts a new draft. Contact details stay; answers and uploaded references do not transfer. Continue?',
      )
    )
      return false
    generation.current++
    prepareRef.current = null
    storage()?.forget('inquiry')
    setError(null)
    setState((current) => ({
      ...freshState(type, current.contact),
      form: current.type === type ? current.form : null,
      selections: current.selections,
    }))
    return true
  }
  function forget() {
    generation.current++
    prepareRef.current = null
    storage()?.forget('inquiry')
    setState((current) => ({
      ...freshState(),
      form: current.type === 'fabric' ? current.form : null,
    }))
    setBusy(false)
    setError(null)
  }
  function addOffer(offer, quantity) {
    if (state.pending) throw new ApiError('LEAD_REQUEST_CONFLICT', { status: 409 })
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000)
      throw new ApiError('INVALID_WHOLESALE', { status: 422 })
    const existing = state.selections.find((item) => item.offer.id === offer.id)
    if (!existing && state.selections.length >= 10)
      throw new ApiError('INVALID_WHOLESALE', { status: 422 })
    if (!changeType('wholesale')) return false
    setState((current) => ({
      ...current,
      selections: existing
        ? current.selections.map((item) =>
            item.offer.id === offer.id ? { offer, quantity } : item,
          )
        : [...current.selections, { offer, quantity }],
    }))
    return true
  }
  async function upload(file) {
    if (busy || retryAt || state.uploadBefore || state.pending) return
    setBusy(true)
    setError(null)
    const started = generation.current
    try {
      const uploadBody = await imageUploadBody(file)
      if (started !== generation.current) return
      const draft = await ensureDraft(),
        owner = stateRef.current.draft
          ? stateRef.current.owner
          : requestOwner(runtime.session.getSnapshot().user)
      const before = await api.readDraft(draft, owner)
      if (started !== generation.current) return
      if (before.images.length + before.uploadingCount >= 5)
        throw new ApiError('LEAD_IMAGE_LIMIT', { status: 409 })
      const uploadBefore = before.images.map((image) => image.id)
      setState((current) => ({ ...current, uploadBefore }))
      try {
        const image = await api.upload(draft, uploadBody, owner)
        if (started !== generation.current) return
        setState((current) => ({
          ...current,
          images: [
            ...current.images.filter((item) => item.id !== image.id),
            { ...image, selected: true },
          ],
          uploadBefore: null,
        }))
      } catch (reason) {
        if (started !== generation.current) return
        if (reason.status >= 400 && reason.status < 500 && reason.status !== 408)
          setState((current) => ({ ...current, uploadBefore: null }))
        report(reason)
      }
    } catch (reason) {
      if (started === generation.current) report(reason)
    } finally {
      if (started === generation.current) setBusy(false)
    }
  }
  async function checkUpload() {
    setBusy(true)
    setError(null)
    const started = generation.current
    try {
      const result = await reconcileUpload(
        api,
        state.draft,
        state.owner,
        state.uploadBefore || state.images.map((image) => image.id),
      )
      if (started !== generation.current) return
      setState((current) => ({
        ...current,
        images: result.images.map((image) => ({
          ...image,
          selected: current.images.find((old) => old.id === image.id)?.selected !== false,
        })),
        uploadBefore: result.uploadingCount ? current.uploadBefore : null,
      }))
    } catch (reason) {
      if (started === generation.current) report(reason)
    } finally {
      if (started === generation.current) setBusy(false)
    }
  }
  async function prepareReview() {
    setBusy(true)
    setError(null)
    const started = generation.current
    try {
      const draft = await ensureDraft()
      if (started !== generation.current) return null
      return { ...stateRef.current, draft }
    } catch (reason) {
      if (started === generation.current) report(reason)
      return null
    } finally {
      if (started === generation.current) setBusy(false)
    }
  }
  async function submit() {
    if (busy || retryAt || state.uploadBefore || state.needsReview) return null
    const pending = state.pending || {
      payload: submissionPayload(state),
      owner: state.owner,
      draft: structuredClone(state.draft),
    }
    setState((current) => ({ ...current, pending }))
    setBusy(true)
    setError(null)
    const started = generation.current
    try {
      const receipt = mergeReceipt(
        state.receipt,
        await api.submit(pending.draft, pending.payload, pending.owner),
      )
      if (started !== generation.current) return null
      if (receipt.trackingToken) {
        try {
          storage()?.save(
            `lead:${receipt.lead.id}`,
            { token: receipt.trackingToken, expiresAt: receipt.trackingExpiresAt },
            Date.parse(receipt.trackingExpiresAt),
          )
        } catch {
          /* Receipt copy/save still works without storage. */
        }
      }
      storage()?.forget('inquiry')
      setState((current) => ({ ...current, receipt, pending: null, uploadBefore: null }))
      return receipt
    } catch (reason) {
      if (started !== generation.current) return null
      // A definite 4xx rejection permits correction; unknown outcomes retain the exact replay body.
      if (
        reason.status >= 400 &&
        reason.status < 500 &&
        !['LEAD_REQUEST_CONFLICT', 'ORIGINAL_SESSION_REQUIRED', 'UNAUTHORIZED'].includes(
          reason.code,
        )
      )
        setState((current) => ({ ...current, pending: null }))
      report(reason)
      return null
    } finally {
      if (started === generation.current) setBusy(false)
    }
  }
  async function refreshForm() {
    setBusy(true)
    setError(null)
    const started = generation.current
    try {
      const form = await api.form(state.type)
      if (started === generation.current)
        setState((current) => ({ ...current, form, needsReview: true }))
    } catch (reason) {
      if (started === generation.current) report(reason)
    } finally {
      if (started === generation.current) setBusy(false)
    }
  }
  async function refreshOffers() {
    setBusy(true)
    setError(null)
    const started = generation.current
    try {
      const results = await Promise.all(
        state.selections.map(async (item) => {
          try {
            return { ...item, offer: await api.offer(item.offer.id) }
          } catch (reason) {
            if (reason.status === 404)
              return { ...item, offer: { ...item.offer, unavailable: true, isAvailable: false } }
            throw reason
          }
        }),
      )
      if (started === generation.current)
        setState((current) => ({ ...current, selections: results, needsReview: true }))
    } catch (reason) {
      if (started === generation.current) report(reason)
    } finally {
      if (started === generation.current) setBusy(false)
    }
  }
  const value = {
    state,
    setState,
    forms,
    api,
    publicData,
    error,
    report,
    clearError: () => setError(null),
    busy,
    loading,
    ready,
    retryAt,
    update,
    changeType,
    forget,
    addOffer,
    upload,
    checkUpload,
    prepareReview,
    submit,
    refreshForm,
    refreshOffers,
    ...access,
  }
  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useInquiry() {
  return useContext(InquiryContext)
}
