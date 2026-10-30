const clone = (value) => structuredClone(value)
import { retailProducts, retailCategories } from '../shop/fixtures.js'
import { ApiError } from '../../../../shared/lib/api.js'
const id = (n) => n.toString(16).padStart(24, '0')
const pageOf = (rows, page, limit) => ({
  items: rows.slice((page - 1) * limit, page * limit),
  pagination: { page, limit, total: rows.length, pages: Math.ceil(rows.length / limit) },
})

// Fixture-only dashboard API; return undefined for routes owned by other modules.
export function createCatalogFixture(seedProducts = retailProducts('en')) {
  const products = clone(seedProducts).map((item) => ({
    ...item,
    version: item.version ?? 0,
    images: item.images ?? [],
    sizeChartId: item.sizeChartId ?? item.sizeChart?.id ?? null,
  }))
  const arCategories = retailCategories('ar'),
    enCategories = retailCategories('en')
  const categories = enCategories.flatMap(function flatten(node) {
    const arNode = arCategories
      .flatMap(function findNodes(item) {
        return [item, ...(item.children || []).flatMap(findNodes)]
      })
      .find((item) => item.id === node.id)
    return [
      {
        id: node.id,
        parentId: node.parentId,
        slug: node.slug,
        name: { en: node.name, ar: arNode?.name || node.name },
        description: { en: '', ar: '' },
        position: 0,
        isActive: true,
        image: null,
      },
      ...(node.children || []).flatMap(flatten),
    ]
  })
  const firstChart = products.find((product) => product.sizeChart)?.sizeChart
  const charts = firstChart
    ? [
        {
          id: firstChart.id,
          version: 0,
          name: { en: firstChart.name, ar: 'دليل مقاس تجريبي' },
          isActive: true,
          images: { en: null, ar: null },
          alt: { en: '', ar: '' },
          measurements: firstChart.measurements,
          assignedProductCount: products.filter((product) => product.sizeChartId === firstChart.id)
            .length,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
        },
      ]
    : []
  const media = new Map()
  const mediaConflict = () => {
    throw new ApiError('MEDIA_CONFLICT', { status: 409 })
  }
  const resolveImages = (ids, kind, targetId, language, retained = []) =>
    ids.map((imageId) => {
      const upload = media.get(imageId)
      if (upload?.kind === kind && upload.targetId === targetId && upload.language === language)
        return upload.image
      if (retained.some((image) => image.id === imageId))
        return retained.find((image) => image.id === imageId)
      return mediaConflict()
    })
  let nextId = 9000
  return async function catalogFixture(path, { method = 'GET', body } = {}) {
    const url = new URL(path, 'http://fixture.local'),
      route = url.pathname.replace(/^\//, ''),
      parts = route.split('/')
    const page = Number(url.searchParams.get('page')) || 1,
      limit = Number(url.searchParams.get('limit')) || 20
    if (parts[0] === 'products') {
      if (parts.length === 1 && method === 'GET')
        return pageOf(
          products.filter(
            (p) =>
              url.searchParams.get('isActive') == null ||
              String(p.isActive) === url.searchParams.get('isActive'),
          ),
          page,
          limit,
        )
      const item = products.find((p) => p.id === parts[1])
      if (parts.length === 2 && method === 'GET') return item ? clone(item) : undefined
      if (parts.length === 1 && method === 'POST') {
        const created = {
          ...clone(body),
          id: id(nextId++),
          version: 0,
          images: [],
          ...(body.type === 'variant'
            ? {
                variants: body.variants.map((v) => ({
                  ...v,
                  id: v.id || id(nextId++),
                  images: [],
                })),
              }
            : {}),
        }
        products.unshift(created)
        return clone(created)
      }
      if (parts.length === 2 && method === 'PATCH' && item && body.version === item.version) {
        const { imageIds, ...fields } = clone(body),
          updated = { ...item, ...fields, version: item.version + 1 }
        const retainedImages = [
          ...item.images,
          ...(item.variants || []).flatMap((v) => v.images || []),
        ]
        if (imageIds)
          updated.images = resolveImages(imageIds, 'product', item.id, null, retainedImages)
        if (body.variants)
          updated.variants = body.variants.map((variant) => {
            const { imageIds: variantImageIds, ...data } = variant
            return {
              ...data,
              id: data.id || id(nextId++),
              images: variantImageIds
                ? resolveImages(variantImageIds, 'product', item.id, null, retainedImages)
                : (item.variants?.find((old) => old.id === data.id)?.images ?? []),
            }
          })
        const index = products.indexOf(item)
        products[index] = updated
        return clone(updated)
      }
      if (parts.length === 2 && method === 'DELETE' && item) {
        products.splice(products.indexOf(item), 1)
        return null
      }
    }
    if (parts[0] === 'categories') {
      if (route === 'categories/tree' && method === 'GET') {
        const byId = new Map(
          categories.map((category) => [category.id, { ...clone(category), children: [] }]),
        )
        const roots = []
        for (const category of byId.values()) {
          const parent = category.parentId && byId.get(category.parentId)
          ;(parent ? parent.children : roots).push(category)
        }
        return roots
      }
      if (parts.length === 1 && method === 'GET') return pageOf(categories, page, limit)
      if (parts.length === 1 && method === 'POST') {
        const created = { ...clone(body), id: id(nextId++), image: null }
        categories.push(created)
        return clone(created)
      }
      const item = categories.find((c) => c.id === parts[1])
      if (parts.length === 2 && method === 'GET') return item ? clone(item) : undefined
      if (parts.length === 2 && method === 'PATCH' && item) {
        const image =
          'imageId' in body
            ? body.imageId
              ? resolveImages(
                  [body.imageId],
                  'category',
                  item.id,
                  null,
                  item.image ? [item.image] : [],
                )[0]
              : null
            : item.image
        const { imageId: _imageId, ...fields } = clone(body)
        Object.assign(item, fields, { image })
        return clone(item)
      }
      if (parts.length === 2 && method === 'DELETE' && item) {
        if (categories.some((category) => category.parentId === item.id))
          throw new ApiError('CATEGORY_HAS_CHILDREN', { status: 409 })
        if (products.some((product) => product.categoryId === item.id))
          throw new ApiError('CATEGORY_HAS_PRODUCTS', { status: 409 })
        categories.splice(categories.indexOf(item), 1)
        return null
      }
    }
    if (parts[0] === 'size-charts') {
      if (parts.length === 1 && method === 'GET') return pageOf(charts, page, limit)
      if (parts.length === 1 && method === 'POST') {
        const created = {
          ...clone(body),
          id: id(nextId++),
          version: 0,
          images: { en: null, ar: null },
          alt: { en: '', ar: '' },
          assignedProductCount: 0,
        }
        charts.push(created)
        return clone(created)
      }
      const item = charts.find((c) => c.id === parts[1])
      if (parts.length === 2 && method === 'GET') return item ? clone(item) : undefined
      if (parts.length === 2 && method === 'PATCH' && item && body.version === item.version) {
        const { imageIds, ...fields } = clone(body)
        const images = { ...item.images }
        for (const locale of ['en', 'ar'])
          if (imageIds && locale in imageIds)
            images[locale] = imageIds[locale]
              ? resolveImages(
                  [imageIds[locale]],
                  'size-chart',
                  item.id,
                  locale,
                  item.images[locale] ? [item.images[locale]] : [],
                )[0]
              : null
        Object.assign(item, fields, { images, version: item.version + 1 })
        return clone(item)
      }
      if (parts.length === 2 && method === 'DELETE' && item) {
        if (products.some((product) => product.sizeChartId === item.id))
          throw new ApiError('SIZE_CHART_IN_USE', { status: 409 })
        charts.splice(charts.indexOf(item), 1)
        return null
      }
      if (parts.length === 4 && parts[2] === 'images' && method === 'POST' && item) {
        const image = {
          id: id(nextId++),
          url: URL.createObjectURL(body instanceof Blob ? body : new Blob()),
          width: 1,
          height: 1,
        }
        media.set(image.id, { image, kind: 'size-chart', targetId: item.id, language: parts[3] })
        return image
      }
    }
    if (parts[0] === 'media' && ['product', 'category'].includes(parts[1]) && method === 'POST') {
      const image = {
        id: id(nextId++),
        url: URL.createObjectURL(body instanceof Blob ? body : new Blob()),
        width: 1,
        height: 1,
      }
      media.set(image.id, { image, kind: parts[1], targetId: parts[2], language: null })
      return image
    }
    return undefined
  }
}
