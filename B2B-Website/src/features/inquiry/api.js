import { ApiError, createApi } from '../../../../shared/lib/api.js'
import { assertOriginalOwner, isId, isSecret, requestOwner, validateSelections } from './model.js'
import { createReviewInquiry } from './fixtures.js'
import { offerSlugs, validOfferKey } from '../../../../shared/lib/offer-slugs.js'

const reviews = new WeakMap()
export function reviewInquiry(session, images = {}) {
  if (!reviews.has(session)) reviews.set(session, createReviewInquiry({ images }))
  return reviews.get(session)
}
export function createInquiryApi(runtime, getLanguage, images) {
  const { api, session, config } = runtime
  const review = config.mode === 'fixtures' ? reviewInquiry(session, images) : null
  const publicProducts = createApi({ ...config, store: 'b2c' }, { getLanguage })
  const queryString = (query) => {
    const values = new URLSearchParams(
      Object.entries(query).filter(([, value]) => value !== '' && value != null),
    )
    return values.size ? `?${values}` : ''
  }
  const identifier = (value) => {
    if (!isId(value)) throw new ApiError('VALIDATION_ERROR', { status: 422 })
    return value.toLowerCase()
  }
  const headers = (draft) => {
    identifier(draft.draftId)
    if (!isSecret(draft.draftToken)) throw new ApiError('UNAUTHORIZED', { status: 401 })
    return { 'X-Lead-Draft-Token': draft.draftToken }
  }
  const owned = (owner, options = {}) => {
    assertOriginalOwner(owner, session.getSnapshot().user)
    return { ...options, authenticated: owner !== null, language: getLanguage() }
  }
  const publicRead = (path, signal) => api.request(path, { signal, language: getLanguage() })
  return {
    forms: (signal) => (review ? review.forms(getLanguage()) : publicRead('/forms', signal)),
    form: (type, signal) =>
      review
        ? review.form(type, getLanguage())
        : publicRead(`/forms/${encodeURIComponent(type)}`, signal),
    offers: (query = {}, signal) =>
      review
        ? review.offers(query, getLanguage())
        : publicRead(`/wholesale/offers${queryString(query)}`, signal),
    async resolveOffer(key, signal) {
      if (!validOfferKey(key)) throw new ApiError('WHOLESALE_OFFER_NOT_FOUND', { status: 404 })
      signal?.throwIfAborted()
      const offer = review
        ? await review.resolveOffer(key, getLanguage())
        : await publicRead(`/wholesale/offers/resolve/${encodeURIComponent(key)}`, signal)
      try {
        offerSlugs([offer])
        if (!validateSelections([{ offer, quantity: 1 }])) throw new Error('Invalid offer')
      } catch {
        throw new ApiError('INVALID_RESPONSE')
      }
      return offer
    },
    offer: (offerId, signal) =>
      review
        ? review.offer(identifier(offerId), getLanguage())
        : publicRead(`/wholesale/offers/${identifier(offerId)}`, signal),
    async sizeChart(offer, signal) {
      if (offer.sourceStore !== 'b2c') return null
      if (review) return review.sizeChart(identifier(offer.productId), getLanguage())
      const product = await publicProducts.request(`/products/${identifier(offer.productId)}`, {
        signal,
      })
      return product.sizeChart || null
    },
    prepare(type, owner) {
      const options = owned(owner, { method: 'POST', body: { formType: type } })
      return review ? review.prepare(type, owner) : api.request('/leads/drafts', options)
    },
    readDraft(draft, owner) {
      const options = owned(owner, { headers: headers(draft) })
      return review
        ? review.readDraft(draft, owner)
        : api.request(`/leads/drafts/${identifier(draft.draftId)}`, options)
    },
    upload(draft, file, owner) {
      const options = owned(owner, {
        method: 'POST',
        body: file,
        headers: { ...headers(draft), 'Content-Type': file.type },
      })
      return review
        ? review.upload(draft, owner)
        : api.request(`/leads/drafts/${identifier(draft.draftId)}/images`, options)
    },
    submit(draft, body, owner) {
      const options = owned(owner, { method: 'POST', body, headers: headers(draft) })
      return review
        ? review.submit(draft, body, owner, getLanguage())
        : api.request('/leads', options)
    },
    track(leadId, token, signal) {
      if (!isSecret(token)) throw new ApiError('LEAD_NOT_FOUND', { status: 404 })
      return review
        ? review.track(identifier(leadId), token, getLanguage())
        : api.request(`/leads/tracking/${identifier(leadId)}`, {
            signal,
            language: getLanguage(),
            headers: { 'X-Lead-Token': token },
          })
    },
    async history(query = {}, signal) {
      const owner = requestOwner(session.getSnapshot().user)
      if (!owner) throw new ApiError('FORBIDDEN', { status: 403 })
      const result = review
        ? await review.history(query, owner, getLanguage())
        : await session.read(api, `/leads${queryString(query)}`, {
            signal,
            language: getLanguage(),
          })
      assertOriginalOwner(owner, session.getSnapshot().user)
      return result
    },
    async detail(leadId, signal) {
      const owner = requestOwner(session.getSnapshot().user)
      if (!owner) throw new ApiError('FORBIDDEN', { status: 403 })
      const result = review
        ? await review.detail(identifier(leadId), owner, getLanguage())
        : await session.read(api, `/leads/${identifier(leadId)}`, {
            signal,
            language: getLanguage(),
          })
      assertOriginalOwner(owner, session.getSnapshot().user)
      return result
    },
  }
}
