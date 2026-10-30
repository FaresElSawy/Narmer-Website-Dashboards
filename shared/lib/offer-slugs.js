export const nameSlug = (title) =>
  (title || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 96)
    .replace(/^-|-$/g, '')

export function offerSlugs(offers) {
  const result = {},
    used = new Set()
  for (const offer of offers) {
    if (Object.hasOwn(result, offer.id)) throw new Error('Duplicate wholesale offer ID')
    for (const key of offerKeys(offer)) {
      if (used.has(key)) throw new Error('Duplicate saved wholesale URL')
      used.add(key)
    }
    result[offer.id] = offer.slug
  }
  return result
}

export const validOfferKey = (value) =>
  typeof value === 'string' && value.length <= 150 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value)

export function offerKeys(offer) {
  if (typeof offer?.id !== 'string' || !/^[a-f\d]{24}$/i.test(offer.id))
    throw new Error('Invalid wholesale offer ID')
  if (!Array.isArray(offer.slugAliases)) throw new Error('Missing wholesale URL aliases')
  const keys = [offer.slug, ...offer.slugAliases]
  if (
    keys.some(
      (key) => !validOfferKey(key) || key !== key.toLowerCase() || /^[a-f\d]{24}$/.test(key),
    )
  )
    throw new Error('Invalid saved wholesale URL')
  return keys
}
