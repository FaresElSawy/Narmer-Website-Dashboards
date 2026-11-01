import slugify from 'slugify'

const titleSlug = (title) =>
  slugify(title, { lower: true, strict: true, locale: 'en' }).slice(0, 150).replace(/-$/, '')

export function updateCatalogName(draft, name, create) {
  const generate =
    create && name.en !== draft.name.en && (!draft.slug || draft.slug === titleSlug(draft.name.en))
  return { ...draft, name, ...(generate ? { slug: titleSlug(name.en) } : {}) }
}

function optionKey(title, fallback, used, option = false) {
  let base = titleSlug(title).slice(0, 40) || fallback
  if ((option && !/^[a-z]/.test(base)) || ['constructor', 'prototype', '__proto__'].includes(base))
    base = `option-${base}`.slice(0, 40)
  let key = base
  for (let suffix = 2; used.includes(key); suffix++) {
    const ending = `-${suffix}`
    key = `${base.slice(0, 40 - ending.length)}${ending}`
  }
  return key
}

const optionNames = {
  color: { en: 'Color', ar: 'اللون' },
  size: { en: 'Size', ar: 'المقاس' },
}

export const productOptionType = (option) =>
  Object.hasOwn(optionNames, option.key) ? option.key : 'other'

function replaceOptionKey(draft, index, key, name) {
  const option = draft.options[index]
  return {
    ...draft,
    options: draft.options.map((item, i) => (i === index ? { ...item, key, name } : item)),
    variants: draft.variants.map((variant) => {
      if (key === option.key || !Object.hasOwn(variant.values, option.key)) return variant
      const values = { ...variant.values, [key]: variant.values[option.key] }
      delete values[option.key]
      return { ...variant, values }
    }),
  }
}

export function updateOptionName(draft, index, name) {
  const option = draft.options[index],
    key =
      option.editorKey && productOptionType(option) === 'other'
        ? optionKey(
            name.en,
            `option-${option.editorKey}`,
            [
              ...draft.options.filter((_, i) => i !== index).map((item) => item.key),
              'color',
              'size',
            ],
            true,
          )
        : option.key
  return replaceOptionKey(draft, index, key, name)
}

export function changeProductOptionType(draft, index, type) {
  if (!['color', 'size', 'other'].includes(type)) throw new Error('Choose Color, Size or Other.')
  const option = draft.options[index],
    previous = productOptionType(option)
  if (previous === type) return draft
  const used = draft.options.filter((_, i) => i !== index).map((item) => item.key)
  if (type !== 'other' && used.includes(type))
    throw new Error('This option type is already configured.')
  const key =
    type === 'other'
      ? optionKey(
          option.name.en,
          `option-${crypto.randomUUID().replaceAll('-', '')}`,
          [...used, 'color', 'size'],
          true,
        )
      : type
  const name = Object.fromEntries(
    ['en', 'ar'].map((language) => [
      language,
      !option.name[language] || option.name[language] === optionNames[previous]?.[language]
        ? optionNames[type]?.[language] || option.name[language]
        : option.name[language],
    ]),
  )
  return replaceOptionKey(draft, index, key, name)
}

export function updateOptionValueName(draft, index, valueIndex, name) {
  const option = draft.options[index],
    value = option.values[valueIndex],
    key = value.editorKey
      ? optionKey(
          name.en,
          `value-${value.editorKey}`,
          option.values.filter((_, i) => i !== valueIndex).map((item) => item.key),
        )
      : value.key
  return {
    ...draft,
    options: draft.options.map((item, i) =>
      i === index
        ? {
            ...item,
            values: item.values.map((choice, j) =>
              j === valueIndex ? { ...choice, key, name } : choice,
            ),
          }
        : item,
    ),
    variants: draft.variants.map((variant) =>
      variant.values[option.key] === value.key
        ? { ...variant, values: { ...variant.values, [option.key]: key } }
        : variant,
    ),
  }
}

export function newProductOptionValue() {
  const editorKey = crypto.randomUUID().replaceAll('-', '')
  return { editorKey, key: `value-${editorKey}`, name: { en: '', ar: '' } }
}

export function newProductOption(type = 'other') {
  const editorKey = crypto.randomUUID().replaceAll('-', '')
  return {
    editorKey,
    key: Object.hasOwn(optionNames, type) ? type : `option-${editorKey}`,
    name: Object.hasOwn(optionNames, type) ? { ...optionNames[type] } : { en: '', ar: '' },
    values: [newProductOptionValue()],
  }
}

export const emptyProduct = (type = 'simple') => ({
  type,
  categoryId: '',
  name: { en: '', ar: '' },
  description: { en: '', ar: '' },
  slug: '',
  isActive: false,
  ...(type === 'simple'
    ? { sku: '', price: '', discountedPrice: '', stock: 0 }
    : { options: [], variants: [] }),
  images: [],
  sizeChartId: null,
})

export function flattenCategories(nodes = []) {
  return (nodes || []).flatMap((node) => [node, ...flattenCategories(node.children || [])])
}

export function productPayload(draft, initial) {
  if (initial.id && draft.type !== initial.type) throw new Error('Product type cannot be changed.')
  const payload = {
    ...(!initial.id && { type: draft.type }),
    version: initial.version,
    categoryId: draft.categoryId,
    name: draft.name,
    description: draft.description,
    slug: draft.slug,
    isActive: draft.isActive,
    sizeChartId: draft.sizeChartId || null,
    ...(initial.id ? { imageIds: draft.images.map(({ id }) => id) } : {}),
  }
  if (draft.type === 'simple') {
    const price = Number(draft.price),
      stock = Number(draft.stock)
    if (
      draft.price === '' ||
      draft.price == null ||
      !Number.isSafeInteger(price) ||
      price < 0 ||
      price > 1000000000 ||
      !Number.isSafeInteger(stock) ||
      stock < 0 ||
      stock > 1000000000
    )
      throw new Error('Price and stock must be non-negative whole numbers.')
    payload.price = price
    payload.stock = stock
    payload.sku = draft.sku || null
    payload.discountedPrice =
      draft.discountedPrice == null || draft.discountedPrice === ''
        ? null
        : Number(draft.discountedPrice)
    if (
      payload.discountedPrice !== null &&
      (!Number.isSafeInteger(payload.discountedPrice) ||
        payload.discountedPrice < 0 ||
        payload.discountedPrice > 1000000000 ||
        payload.discountedPrice >= price)
    )
      throw new Error('Discount must be a whole amount below the base price.')
  } else {
    if (
      !draft.options.length ||
      draft.options.length > 5 ||
      !draft.variants.length ||
      draft.variants.length > 100
    )
      throw new Error('Use 1-5 options and 1-100 sellable variants.')
    const reserved = new Set(['constructor', 'prototype', '__proto__']),
      keys = new Set()
    for (const option of draft.options) {
      if (
        !/^[a-z][a-z0-9_-]{0,39}$/.test(option.key) ||
        reserved.has(option.key) ||
        keys.has(option.key)
      )
        throw new Error('Option keys must be unique, valid machine keys.')
      keys.add(option.key)
      const values = new Set()
      if (!option.values.length || option.values.length > 50)
        throw new Error('Use 1-50 values per option.')
      for (const value of option.values) {
        if (
          !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(value.key) ||
          reserved.has(value.key) ||
          values.has(value.key)
        )
          throw new Error('Value keys must be unique, valid machine keys.')
        values.add(value.key)
      }
    }
    const combinations = new Set()
    for (const variant of draft.variants) {
      if (
        Object.keys(variant.values).length !== keys.size ||
        draft.options.some(
          (option) => !option.values.some((value) => value.key === variant.values[option.key]),
        )
      )
        throw new Error('Every variant must select one configured value for each option.')
      const combination = JSON.stringify(draft.options.map((option) => variant.values[option.key]))
      if (combinations.has(combination))
        throw new Error('Each variant must have a different option combination.')
      combinations.add(combination)
    }
    payload.options = draft.options.map(({ key, name, values }) => ({
      key,
      name,
      values: values.map(({ key, name }) => ({ key, name })),
    }))
    payload.variants = draft.variants.map((variant) => {
      const price = Number(variant.price),
        stock = Number(variant.stock)
      if (
        variant.price === '' ||
        variant.price == null ||
        !Number.isSafeInteger(price) ||
        price < 0 ||
        price > 1000000000 ||
        !Number.isSafeInteger(stock) ||
        stock < 0 ||
        stock > 1000000000
      )
        throw new Error('Variant price and stock must be non-negative whole numbers.')
      const discountedPrice =
        variant.discountedPrice === '' || variant.discountedPrice == null
          ? null
          : Number(variant.discountedPrice)
      if (
        discountedPrice !== null &&
        (!Number.isSafeInteger(discountedPrice) ||
          discountedPrice < 0 ||
          discountedPrice > 1000000000 ||
          discountedPrice >= price)
      )
        throw new Error('Variant discount must be a whole amount below its base price.')
      return {
        ...(variant.id ? { id: variant.id } : {}),
        values: variant.values,
        price,
        stock,
        sku: variant.sku || null,
        discountedPrice,
        ...(initial.id ? { imageIds: (variant.images || []).map(({ id }) => id) } : {}),
      }
    })
  }
  return payload
}

export function categoryPayload(draft, initial) {
  const fields = ['name', 'description', 'slug', 'parentId', 'position', 'isActive']
  if (!initial) return Object.fromEntries(fields.map((key) => [key, draft[key]]))
  const body = {}
  for (const key of fields) {
    if (JSON.stringify(draft[key]) !== JSON.stringify(initial[key])) body[key] = draft[key]
  }
  if ((draft.imageId ?? draft.image?.id ?? null) !== (initial.image?.id ?? null))
    body.imageId = draft.imageId ?? null
  return body
}

export function validateMeasurements(measurements) {
  if (measurements == null) return
  if (
    measurements.unit !== 'cm' ||
    !Array.isArray(measurements.rows) ||
    !measurements.rows.length ||
    measurements.rows.length > 50
  )
    throw new Error('Enter 1–50 measurement rows in cm.')
  const seen = new Set()
  const rows = measurements.rows.map((row, index) => {
    const size = row.size.trim(),
      key = size.toLocaleLowerCase()
    if (!key || [...size].length > 30 || seen.has(key))
      throw new Error(`Check size label in row ${index + 1}.`)
    seen.add(key)
    const normalized = { size }
    for (const field of ['chest', 'length', 'sleeve']) {
      const value = Number(row[field])
      if (
        !Number.isFinite(value) ||
        value < 0.01 ||
        value > 1000 ||
        Number(value.toFixed(2)) !== value
      )
        throw new Error(
          `Check ${field} in row ${index + 1}; use 0.01–1000 with at most two decimals.`,
        )
      normalized[field] = Number(value.toFixed(2))
    }
    return normalized
  })
  return { unit: 'cm', rows }
}

export function sizeChartPayload(draft, initial) {
  const measurements = validateMeasurements(draft.measurements)
  const payload = {
    name: draft.name,
    isActive: draft.isActive,
    measurements,
    ...(initial ? { alt: draft.alt } : {}),
  }
  if (initial) {
    payload.version = initial.version
    payload.imageIds = Object.fromEntries(
      ['en', 'ar']
        .filter((language) => draft.images[language]?.id !== initial.images[language]?.id)
        .map((language) => [language, draft.images[language]?.id ?? null]),
    )
    if (!Object.keys(payload.imageIds).length) delete payload.imageIds
  }
  return payload
}
