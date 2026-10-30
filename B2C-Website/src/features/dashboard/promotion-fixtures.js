const clone = (value) => structuredClone(value)
const id = (n) => n.toString(16).padStart(24, '0')
const paged = (rows, page, limit) => ({
  items: clone(rows.slice((page - 1) * limit, page * limit)),
  pagination: { page, limit, total: rows.length, pages: Math.ceil(rows.length / limit) },
})

// Fixture-only dashboard API; return undefined for routes owned by other modules.
export function createPromotionFixture() {
  const sales = [],
    coupons = [],
    shipping = []
  let defaults = { configured: true, defaultFee: 5000, currency: 'EGP' },
    receivingAccount = null,
    nextId = 9100
  return async function promotionFixture(path, { method = 'GET', body } = {}) {
    const url = new URL(path, 'http://fixture.local'),
      route = url.pathname.replace(/^\//, ''),
      parts = route.split('/')
    const page = Number(url.searchParams.get('page')) || 1,
      limit = Number(url.searchParams.get('limit')) || 20
    if (parts[0] === 'sales' || parts[0] === 'coupons') {
      const rows = parts[0] === 'sales' ? sales : coupons,
        param = parts[0] === 'sales' ? 'saleId' : 'couponId'
      if (parts.length === 1 && method === 'GET')
        return paged(
          rows.filter(
            (row) =>
              (url.searchParams.get('isEnabled') == null ||
                String(row.isEnabled) === url.searchParams.get('isEnabled')) &&
              (url.searchParams.get('targetType') == null ||
                row.targetType === url.searchParams.get('targetType')),
          ),
          page,
          limit,
        )
      if (parts.length === 1 && method === 'POST') {
        const row = { ...clone(body), id: id(nextId++) }
        rows.unshift(row)
        return clone(row)
      }
      const row = rows.find((entry) => entry.id === parts[1])
      if (parts.length === 2 && method === 'GET') return row ? clone(row) : undefined
      if (parts.length === 2 && method === 'PATCH' && row) {
        Object.assign(row, clone(body))
        return clone(row)
      }
      if (parts.length === 2 && method === 'DELETE' && row) {
        rows.splice(rows.indexOf(row), 1)
        return null
      }
      void param
    }
    if (parts[0] === 'shipping-fees') {
      if (parts.length === 1 && method === 'GET')
        return paged(
          shipping.slice().sort((a, b) => a.governorateCode.localeCompare(b.governorateCode)),
          page,
          limit,
        )
      if (parts.length === 1 && method === 'POST') {
        const row = { ...clone(body), id: id(nextId++) }
        shipping.push(row)
        return clone(row)
      }
      if (parts.length === 2 && parts[1] === 'default') {
        if (method === 'GET') return clone(defaults)
        if (method === 'PATCH') {
          defaults = { ...defaults, ...clone(body) }
          return clone(defaults)
        }
      }
      const row = shipping.find((entry) => entry.id === parts[1])
      if (parts.length === 2 && method === 'GET') return row ? clone(row) : undefined
      if (parts.length === 2 && method === 'PATCH' && row) {
        Object.assign(row, clone(body))
        return clone(row)
      }
      if (parts.length === 2 && method === 'DELETE' && row) {
        shipping.splice(shipping.indexOf(row), 1)
        return null
      }
    }
    if (route === 'orders/settings') {
      if (method === 'GET') return { receivingAccount }
      if (method === 'PATCH') {
        receivingAccount = body.receivingAccount ?? null
        return { receivingAccount }
      }
    }
    return undefined
  }
}
