import { ApiError } from '../../../../shared/lib/api.js'
import { categoryRows } from './catalog.js'
import { reviewCatalogue } from '../../content/catalogue.js'

export const fixtureId = (value) => value.toString(16).padStart(24, '0')
const fixtures = new WeakMap()
const local = (en, ar, language) => (language === 'ar' ? ar : en)
const sizes = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl']
export function retailProducts(language = 'en', images = {}) {
  return reviewCatalogue.map((item, index) => {
    const price = index === 0 ? 75000 : index === 9 ? 79000 : 79900
    const discountedPrice = index === 9 ? 69900 : [3, 6].includes(index) ? 59900 : null
    const gallery = images.galleries?.[item.slug] || []
    const product = {
      id: fixtureId(100 + index),
      type: 'variant',
      categoryId: fixtureId(item.category),
      name: item.name[language],
      slug: item.slug,
      description: local(
        'Narmer everyday collection. Prices, sizes and stock are demonstration values for review.',
        'مجموعة نارمر اليومية. الأسعار والمقاسات والكميات قيم تجريبية للمراجعة.',
        language,
      ),
      isActive: true,
      currency: 'EGP',
      images: gallery,
      sizeChart:
        index === 0
          ? {
              id: fixtureId(700),
              name: local('Demo hoodie size guide', 'دليل مقاسات هودي تجريبي', language),
              image: null,
              alt: '',
              measurements: {
                unit: 'cm',
                rows: sizes.map((size, i) => ({
                  size: size.toUpperCase(),
                  chest: 48 + i * 2,
                  length: 64 + i * 2,
                  sleeve: 58 + i,
                })),
              },
            }
          : null,
      options: [
        {
          key: 'color',
          name: local('Color', 'اللون', language),
          values: [{ key: item.color.key, name: item.color.name[language] }],
        },
        {
          key: 'size',
          name: local('Size', 'المقاس', language),
          values: sizes.map((key) => ({ key, name: key.toUpperCase() })),
        },
      ],
      variants: sizes.map((size, i) => ({
        id: fixtureId(
          index === 0 ? 200 + i : index === 9 && size === 'm' ? 210 : 1000 + index * 10 + i,
        ),
        values: { color: item.color.key, size },
        sku: null,
        price,
        discountedPrice,
        effectivePrice: discountedPrice ?? price,
        activeSale: null,
        stock:
          index === 10
            ? 0
            : index === 9
              ? size === 'm'
                ? 12
                : 0
              : index === 0
                ? size === 'xl'
                  ? 0
                  : 12000
                : 15000,
        images: gallery,
      })),
      priceFrom: discountedPrice ?? price,
    }
    return product
  })
}
export function retailCategories(language = 'en') {
  const node = (id, parentId, slug, en, ar, children = []) => ({
    id: fixtureId(id),
    parentId: parentId === null ? null : fixtureId(parentId),
    slug,
    name: local(en, ar, language),
    isActive: true,
    image: null,
    children,
  })
  return [
    node(10, null, 'men', 'Men', 'رجالي', [
      node(11, 10, 'mens-hoodies', 'Hoodies', 'هودي'),
      node(12, 10, 'mens-sweatshirts', 'Sweatshirts', 'سويت شيرت'),
    ]),
    node(20, null, 'women', 'Women', 'حريمي', [
      node(21, 20, 'womens-hoodies', 'Hoodies', 'هودي'),
      node(22, 20, 'womens-sweatshirts', 'Sweatshirts', 'سويت شيرت'),
      node(23, 20, 'womens-quarter-zips', 'Quarter-zips', 'نص سحاب'),
    ]),
    node(30, null, 'kids', 'Kids', 'أطفال'),
  ]
}
export function retailHomepage(language, images) {
  const products = retailProducts(language, images)
  return {
    store: 'b2c',
    slots: [
      'hero-left',
      'hero-right',
      'collection-men',
      'collection-women',
      'collection-kids',
      'sale-feature',
      'factory-story',
    ].map((key) => ({ key, desktopImage: null, mobileImage: null, alt: '' })),
    updatedAt: null,
    newArrivals: { items: [4, 5, 6, 7].map((i) => products[i]) },
    sale: { items: [products[3], products[6]] },
  }
}
export function createRetailFixture(session, images = {}, catalog = retailProducts) {
  if (fixtures.has(session)) return fixtures.get(session)
  let guest = [],
    saved = new Map(),
    carts = new Map()
  const owner = () => session.getSnapshot().user?.id || null
  const customer = () => {
    if (session.getSnapshot().user?.role !== 'user')
      throw new ApiError('FORBIDDEN', { status: 403 })
  }
  const summary = (lines, language) => {
    const products = catalog(language, images)
    const items = lines.map((line) => {
      const product = products.find((p) => p.id === line.productId),
        variant = line.variantId ? product?.variants?.find((v) => v.id === line.variantId) : product
      const available = product && variant
      const unitPrice = available ? variant.effectivePrice : null
      return {
        ...line,
        name: available ? product.name : null,
        slug: available ? product.slug : null,
        images: available ? variant.images : [],
        values: available ? variant.values || null : null,
        sku: available ? variant.sku : null,
        price: available ? variant.price : null,
        discountedPrice: available ? variant.discountedPrice : null,
        activeSale: available ? variant.activeSale : null,
        unitPrice,
        stock: available ? variant.stock : null,
        lineTotal: unitPrice === null ? null : unitPrice * line.quantity,
        status: !available
          ? 'unavailable'
          : variant.stock < line.quantity
            ? 'insufficient_stock'
            : 'available',
      }
    })
    return {
      items,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.some((i) => i.lineTotal === null)
        ? null
        : items.reduce((n, i) => n + i.lineTotal, 0),
      currency: 'EGP',
      canCheckout: items.length > 0 && items.every((i) => i.status === 'available'),
    }
  }
  const list = (query, language, ignored = '') => {
    const q = new URLSearchParams(query),
      categories = categoryRows(retailCategories(language)),
      category = q.get('categoryId')
    const scope = new Set(
      category
        ? [category, ...categories.filter((c) => c.parentId === category).map((c) => c.id)]
        : categories.map((c) => c.id),
    )
    return catalog(language, images).flatMap((product) => {
      if (!scope.has(product.categoryId) || (q.get('type') && product.type !== q.get('type')))
        return []
      const candidates = (product.type === 'simple' ? [product] : product.variants).filter(
        (v) =>
          (!q.get('size') || ignored === 'size' || v.values?.size === q.get('size')) &&
          (!q.get('color') || ignored === 'color' || v.values?.color === q.get('color')) &&
          (!q.has('minPrice') ||
            ignored === 'price' ||
            v.effectivePrice >= Number(q.get('minPrice'))) &&
          (!q.has('maxPrice') ||
            ignored === 'price' ||
            v.effectivePrice <= Number(q.get('maxPrice'))) &&
          (q.get('saleOnly') !== 'true' || v.effectivePrice < v.price),
      )
      const match = candidates.sort(
        (a, b) => a.effectivePrice - b.effectivePrice || String(a.id).localeCompare(String(b.id)),
      )[0]
      return match
        ? [
            {
              ...product,
              matchingPrice: match.effectivePrice,
              matchingVariantId: product.type === 'variant' ? match.id : null,
            },
          ]
        : []
    })
  }
  const api = {
    categories: async ({ language = 'en' } = {}) => retailCategories(language),
    homepage: async ({ language = 'en' } = {}) => retailHomepage(language, images),
    settings: async () => ({
      store: 'b2c',
      phones: [],
      emails: [],
      address: '',
      seo: { title: '', description: '', keywords: '' },
    }),
    async products(query, { language = 'en' } = {}) {
      const q = new URLSearchParams(query),
        items = list(q, language),
        page = Number(q.get('page') || 1),
        limit = Number(q.get('limit') || 12)
      if (q.get('sort')?.startsWith('price-'))
        items.sort(
          (a, b) => (a.matchingPrice - b.matchingPrice) * (q.get('sort') === 'price-desc' ? -1 : 1),
        )
      return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) },
      }
    },
    async facets(query, { language = 'en' } = {}) {
      const q = new URLSearchParams(query),
        products = catalog(language, images),
        price = list(q, language, 'price').flatMap((p) =>
          p.type === 'simple' ? [p.effectivePrice] : p.variants.map((v) => v.effectivePrice),
        )
      const choices = (key) =>
        products
          .flatMap((p) => p.options?.find((o) => o.key === key)?.values || [])
          .filter((v, i, all) => all.findIndex((a) => a.key === v.key) === i)
          .map((v) => ({
            ...v,
            count: list(
              new URLSearchParams([...q].filter(([k]) => k !== key).concat([[key, v.key]])),
              language,
            ).length,
          }))
      return {
        currency: 'EGP',
        pricedAt: new Date().toISOString(),
        price: {
          min: price.length ? Math.min(...price) : null,
          max: price.length ? Math.max(...price) : null,
        },
        sizes: choices('size'),
        colors: choices('color'),
        applied: Object.fromEntries(q),
      }
    },
    async product(id, { language = 'en' } = {}) {
      const product = catalog(language, images).find((p) => p.id === id)
      if (!product) throw new ApiError('PRODUCT_NOT_FOUND', { status: 404 })
      return product
    },
    async cart(asGuest = false, { language = 'en' } = {}) {
      if (owner()) customer()
      return summary(asGuest || !owner() ? guest : carts.get(owner()) || [], language)
    },
    async setQuantity(body, asGuest = false, { language = 'en' } = {}) {
      if (owner()) customer()
      if (!Number.isSafeInteger(body.quantity) || body.quantity < 0 || body.quantity > 10000)
        throw new ApiError('VALIDATION_ERROR', { status: 422 })
      const current = asGuest || !owner() ? guest : carts.get(owner()) || []
      const lines = current.filter(
        (i) => !(i.productId === body.productId && i.variantId === (body.variantId || null)),
      )
      if (body.quantity)
        lines.push({
          productId: body.productId,
          variantId: body.variantId || null,
          quantity: body.quantity,
        })
      const next = summary(lines, language)
      if (body.quantity && (next.items.at(-1)?.status !== 'available' || lines.length > 100))
        throw new ApiError('CART_INSUFFICIENT_STOCK', { status: 409 })
      if (asGuest || !owner()) guest = lines
      else carts.set(owner(), lines)
      return next
    },
    async merge() {
      customer()
      const lines = structuredClone(carts.get(owner()) || [])
      for (const line of guest) {
        const existing = lines.find(
          (i) => i.productId === line.productId && i.variantId === line.variantId,
        )
        if (existing) existing.quantity += line.quantity
        else lines.push({ ...line })
      }
      const next = summary(lines, 'en')
      if (
        lines.length > 100 ||
        lines.some((i) => i.quantity > 10000) ||
        next.items.some((i) => i.status !== 'available')
      )
        throw new ApiError('CART_MERGE_CONFLICT', { status: 409 })
      carts.set(owner(), lines)
      guest = []
      return next
    },
    async wishlist({ language = 'en' } = {}) {
      customer()
      const products = catalog(language, images),
        items = (saved.get(owner()) || []).map((productId) => {
          const product = products.find((p) => p.id === productId) || null
          return { productId, product, status: product ? 'available' : 'unavailable' }
        })
      return { items, itemCount: items.length }
    },
    async save(id, remove = false, { language = 'en' } = {}) {
      customer()
      const ids = saved.get(owner()) || []
      if (remove)
        saved.set(
          owner(),
          ids.filter((i) => i !== id),
        )
      else if (!ids.includes(id)) {
        if (ids.length >= 100) throw new ApiError('WISHLIST_LIMIT_REACHED', { status: 409 })
        await api.product(id)
        saved.set(owner(), [...ids, id])
      }
      return api.wishlist({ language })
    },
  }
  fixtures.set(session, api)
  return api
}
