import { ApiError } from '../../../../shared/lib/api.js'

export const formTypes = ['spinning', 'weaving', 'fabric', 'school-uniforms', 'wholesale']
export const emptyContact = () => ({
  name: '',
  phone: '',
  email: '',
  governorate: '',
  district: '',
})
export const isId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
export const isSecret = (value) => typeof value === 'string' && /^[a-zA-Z\d_-]{43}$/.test(value)
export const localText = (value, language) =>
  typeof value === 'string' ? value : value?.[language] || value?.en || value?.ar || ''
export const requestOwner = (user) =>
  user?.role === 'user' && user.store === 'b2b' ? user.id : null

export function assertOriginalOwner(owner, user) {
  if (owner !== null && owner !== requestOwner(user))
    throw new ApiError('ORIGINAL_SESSION_REQUIRED', { status: 401 })
}

export function validateDetails(definition, contact, answers) {
  const errors = {}
  for (const field of definition.fixedFields) {
    const raw = contact[field.key] ?? '',
      value = typeof raw === 'string' ? raw.trim() : ''
    if ((field.required && !value) || value.length > field.constraints.maxLength)
      errors[`contact.${field.key}`] = 'required'
    if (field.key === 'phone' && !/^\+?\d{6,15}$/.test(value.replace(/[ ()-]/g, '')))
      errors['contact.phone'] = 'phone'
    if (field.key === 'email' && raw && (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))
      errors['contact.email'] = 'email'
  }
  for (const field of definition.fields) {
    const value = answers[field.key],
      key = `answers.${field.key}`,
      rules = field.constraints
    const missing =
      value == null ||
      (typeof value === 'string' && !value.trim()) ||
      (Array.isArray(value) && !value.length)
    if (missing) {
      if (field.required) errors[key] = 'required'
      continue
    }
    if (
      ['text', 'textarea'].includes(field.type) &&
      (typeof value !== 'string' ||
        value.trim().length < rules.minLength ||
        value.trim().length > rules.maxLength)
    )
      errors[key] = 'length'
    if (
      field.type === 'number' &&
      (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < rules.min ||
        value > rules.max)
    )
      errors[key] = 'number'
    if (field.type === 'boolean' && typeof value !== 'boolean') errors[key] = 'choice'
    if (field.type === 'select' && !field.choices.some((choice) => choice.key === value))
      errors[key] = 'choice'
    if (
      field.type === 'multiselect' &&
      (!Array.isArray(value) ||
        value.length > rules.maxItems ||
        new Set(value).size !== value.length ||
        value.some((item) => !field.choices.some((choice) => choice.key === item)))
    )
      errors[key] = 'choice'
  }
  return errors
}

export function validateSelections(selections) {
  return (
    selections.length >= 1 &&
    selections.length <= 10 &&
    new Set(selections.map((item) => item.offer.id)).size === selections.length &&
    selections.every(
      ({ offer, quantity }) =>
        isId(offer.id) &&
        Number.isSafeInteger(offer.version) &&
        offer.version >= 0 &&
        offer.isAvailable &&
        offer.isActive &&
        !offer.unavailable &&
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        quantity <= 10000,
    )
  )
}

export function submissionPayload(state) {
  if (
    !state.form ||
    Object.keys(validateDetails(state.form, state.contact, state.answers)).length ||
    !isId(state.draft?.draftId)
  )
    throw new ApiError('INVALID_LEAD', { status: 422 })
  if (state.type === 'wholesale' && !validateSelections(state.selections))
    throw new ApiError('INVALID_WHOLESALE', { status: 422 })
  const contact = Object.fromEntries(
    state.form.fixedFields.map((field) => [
      field.key,
      String(state.contact[field.key] ?? '').trim(),
    ]),
  )
  contact.phone = contact.phone.replace(/[ ()-]/g, '')
  contact.email = contact.email ? contact.email.toLowerCase() : null
  const answers = {}
  for (const field of state.form.fields) {
    const value = state.answers[field.key]
    if (
      value == null ||
      (typeof value === 'string' && !value.trim()) ||
      (Array.isArray(value) && !value.length)
    )
      continue
    answers[field.key] =
      typeof value === 'string' && ['text', 'textarea'].includes(field.type)
        ? value.trim()
        : structuredClone(value)
  }
  return {
    draftId: state.draft.draftId,
    formVersion: state.form.version,
    contact,
    answers,
    imageIds: state.images.filter((image) => image.selected !== false).map((image) => image.id),
    wholesaleRequests:
      state.type === 'wholesale'
        ? state.selections.map(({ offer, quantity }) => ({
            offerId: offer.id,
            version: offer.version,
            quantity,
          }))
        : [],
  }
}

export function mergeReceipt(previous, receipt) {
  if (!receipt?.lead?.id) throw new ApiError('INVALID_RESPONSE')
  const same = previous?.lead?.id === receipt.lead.id
  return {
    ...receipt,
    trackingToken: receipt.trackingToken ?? (same ? previous.trackingToken : null),
    trackingExpiresAt: receipt.trackingExpiresAt ?? (same ? previous.trackingExpiresAt : null),
  }
}

export function compositionRows(offer, language) {
  return offer.composition.map((row, index) => {
    const variant = offer.product?.variants.find((item) => item.id === row.variantId)
    const selection = variant
      ? offer.product.options
          .map(
            (option) =>
              `${localText(option.name, language)}: ${localText(option.values.find((item) => item.key === variant.values[option.key])?.name, language)}`,
          )
          .join(' · ')
      : localText(offer.product?.name || offer.name, language)
    return { id: row.variantId || `simple-${index}`, selection, quantity: row.quantity }
  })
}

export async function reconcileUpload(
  api,
  draft,
  owner,
  before,
  { wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 3 } = {},
) {
  let result
  for (let attempt = 0; attempt < attempts; attempt++) {
    result = await api.readDraft(draft, owner)
    const added = result.images.filter((image) => !before.includes(image.id))
    if (added.length || result.uploadingCount === 0) return { ...result, added }
    if (attempt + 1 < attempts) await wait(350 * (attempt + 1))
  }
  return { ...result, added: [] }
}
