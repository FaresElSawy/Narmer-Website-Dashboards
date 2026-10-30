import { parseMoney } from '../../../../shared/lib/money.js'

export const productPath = (product) => `/products/${product.slug}`
export const categoryRows = (tree, depth = 0) =>
  tree.flatMap((node) => [{ ...node, depth }, ...categoryRows(node.children || [], depth + 1)])
export const selectedVariant = (product, values) =>
  product.type === 'simple'
    ? product
    : product.variants.find((variant) =>
        product.options.every((option) => variant.values[option.key] === values[option.key]),
      )

export function optionVariant(product, values, key, value) {
  const variants = product.variants.filter((variant) => variant.values[key] === value)
  const matches = (variant) =>
    Object.entries(values).every(
      ([other, selected]) => other === key || variant.values[other] === selected,
    )
  return (
    variants.find((variant) => matches(variant) && variant.stock > 0) ||
    variants.find((variant) => variant.stock > 0) ||
    variants.find(matches) ||
    variants[0]
  )
}

export function catalogQuery(search, categories = []) {
  const input = new URLSearchParams(search),
    query = new URLSearchParams()
  for (const key of [
    'categoryId',
    'type',
    'minPrice',
    'maxPrice',
    'size',
    'color',
    'saleOnly',
    'sort',
    'page',
  ]) {
    if (input.get(key)) query.set(key, input.get(key))
  }
  const collection = input.get('collection')
  if (collection && !query.has('categoryId')) {
    const category = categoryRows(categories).find((node) => node.slug === collection)
    if (!category) throw new Error('CATEGORY_UNAVAILABLE')
    query.set('categoryId', category.id)
  }
  if (input.get('sale') === 'true') query.set('saleOnly', 'true')
  query.set('limit', '12')
  return query
}

export function priceFilter(value) {
  if (value === '') return null
  const amount = parseMoney(value)
  if (amount > 1000000000) throw new RangeError('Price exceeds supported range')
  return String(amount)
}

export function nextSaleExpiry(data, now = Date.now()) {
  const products = data?.list?.items || data?.items?.map((item) => item.product || item) || [data]
  const dates = products
    .flatMap((product) => product?.variants || [product])
    .map((item) => Date.parse(item?.activeSale?.endsAt))
    .filter((date) => Number.isFinite(date) && date > now)
  return dates.length ? Math.min(...dates) : null
}

// shortcut: direct links without a known ID scan public pages; replace this when Products exposes slug lookup.
export async function productBySlug(api, slug, { hint, ...options } = {}) {
  if (hint) {
    const product = await api.product(hint, options)
    if (product.slug === slug) return product
  }
  let page = 1,
    pages = 1
  while (page <= pages) {
    const result = await api.products(
      new URLSearchParams({ limit: '100', page: String(page) }),
      options,
    )
    const product = result.items.find((item) => item.slug === slug)
    if (product) return api.product(product.id, options)
    pages = result.pagination.pages
    page++
  }
  throw Object.assign(
    new Error(options.language === 'ar' ? 'المنتج غير متاح.' : 'Product not found.'),
    { code: 'PRODUCT_NOT_FOUND', status: 404 },
  )
}
