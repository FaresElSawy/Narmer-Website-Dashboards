import test from 'node:test'
import assert from 'node:assert/strict'
import {
  catalogQuery,
  priceFilter,
  selectedVariant,
  optionVariant,
  productBySlug,
  nextSaleExpiry,
} from '../../B2C-Website/src/features/shop/catalog.js'
import {
  createRetailFixture as createCatalogueFixture,
  fixtureId,
  retailProducts,
  retailCategories,
} from '../../B2C-Website/src/features/shop/fixtures.js'
import { commerceProducts } from './retail-sample-products.mjs'
import { reviewCatalogue } from '../../B2C-Website/src/content/catalogue.js'
import { createRetailApi } from '../../B2C-Website/src/features/shop/api.js'
import { createApi } from '../lib/api.js'
import { createSession } from '../lib/session.js'

const createRetailFixture = (session, images = {}) =>
  createCatalogueFixture(session, images, commerceProducts)

test('review catalogue contains the eleven supplied designs and all 42 ordered photos', async () => {
  const products = retailProducts()
  assert.equal(products.length, 11)
  assert.equal(new Set(products.map((product) => product.id)).size, 11)
  assert.equal(
    new Set(products.flatMap((product) => product.variants.map((variant) => variant.id))).size,
    66,
  )
  assert.equal(
    reviewCatalogue.reduce((count, product) => count + product.gallery.length, 0),
    42,
  )
  assert.equal(reviewCatalogue.filter((product) => product.gallery.length === 2).length, 1)
  assert.ok(
    products.every(
      (product) => product.options[0].values.length === 1 && product.options[1].values.length === 6,
    ),
  )
  const api = createCatalogueFixture(createSession('b2c'))
  assert.equal((await api.products('categoryId=' + fixtureId(10))).pagination.total, 5)
  assert.equal((await api.products('categoryId=' + fixtureId(20))).pagination.total, 6)
  assert.equal((await api.products('categoryId=' + fixtureId(11))).pagination.total, 3)
  assert.equal((await api.products('categoryId=' + fixtureId(23))).pagination.total, 3)
  assert.equal((await api.products('color=brown&size=s')).pagination.total, 1)
  assert.equal(
    (await api.product(fixtureId(109))).variants.find((variant) => variant.values.size === 's')
      .stock,
    0,
  )
})

const customer = (session, id = 'customer-a', role = 'user') =>
  session.accept({
    user: { id, name: id, role, store: 'b2c' },
    accessToken: 'test-token',
    expiresIn: 900,
  })
test('retail filters use category IDs, supported wire keys and integer piastres', () => {
  const query = catalogQuery('collection=men&sale=true&search=ignored&page=2', retailCategories())
  assert.equal(query.get('categoryId'), fixtureId(10))
  assert.equal(query.get('saleOnly'), 'true')
  assert.equal(query.has('search'), false)
  assert.equal(priceFilter('100.25'), '10025')
  assert.equal(priceFilter('0'), '0')
  assert.equal(priceFilter(''), null)
  assert.throws(() => priceFilter('10000000.01'))
  assert.throws(
    () => catalogQuery('collection=missing', retailCategories()),
    /CATEGORY_UNAVAILABLE/,
  )
})
test('readable product links retain IDs internally and resolve bookmarked slugs', async () => {
  const api = createRetailFixture(createSession('b2c'))
  assert.equal(
    (await productBySlug(api, 'logo-hoodie', { hint: fixtureId(100) })).id,
    fixtureId(100),
  )
  assert.equal((await productBySlug(api, 'blue-sweatshirt')).id, fixtureId(105))
  await assert.rejects(productBySlug(api, 'missing-product'), (error) => error.status === 404)
})
test('sale expiry is taken from current Product, Wishlist and Cart data', () => {
  const sale = { endsAt: '2026-10-24T09:00:00.000Z' },
    now = Date.parse('2026-10-24T08:00:00.000Z')
  assert.equal(
    nextSaleExpiry({ items: [{ product: { variants: [{ activeSale: sale }] } }] }, now),
    Date.parse(sale.endsAt),
  )
  assert.equal(nextSaleExpiry({ items: [{ activeSale: sale }] }, now), Date.parse(sale.endsAt))
  assert.equal(nextSaleExpiry({ activeSale: sale }, Date.parse(sale.endsAt)), null)
})
test('variant selection requires one real complete combination and supports larger sizes', () => {
  const product = commerceProducts()[0]
  assert.equal(selectedVariant(product, { color: 'brown', size: 's' }), undefined)
  assert.equal(selectedVariant(product, { color: 'beige' }), undefined)
  assert.equal(selectedVariant(product, { color: 'beige', size: 'xxxl' }).id, fixtureId(205))
  assert.equal(selectedVariant(product, { color: 'beige', size: 'xl' }).stock, 0)
})

test('color previews choose a real available variant and retain out-of-stock previews', () => {
  const product = commerceProducts()[0]
  const brown = optionVariant(product, { color: 'beige', size: 's' }, 'color', 'brown')
  assert.equal(brown.id, fixtureId(210))
  assert.deepEqual(brown.values, { color: 'brown', size: 'm' })
  assert.equal(optionVariant(product, brown.values, 'color', 'beige').values.size, 'm')
  const soldOut = {
    ...product,
    variants: product.variants.map((variant) => ({ ...variant, stock: 0 })),
  }
  assert.equal(optionVariant(soldOut, { color: 'beige', size: 's' }, 'color', 'brown').id, brown.id)
  assert.equal(optionVariant(product, {}, 'color', 'missing'), undefined)
})
test('catalog fixture filters the same variant and retains valid zero prices', async () => {
  const api = createRetailFixture(createSession('b2c'))
  const noMatch = await api.products('color=brown&size=s')
  assert.equal(noMatch.pagination.total, 0)
  const match = await api.products('color=brown&size=m&minPrice=69900&maxPrice=69900')
  assert.equal(match.items[0].matchingVariantId, fixtureId(210))
  const zero = await api.products('minPrice=0&maxPrice=0&saleOnly=true')
  assert.equal(zero.items[0].matchingPrice, 0)
  assert.equal(zero.pagination.total, 1)
})
test('absolute cart writes, exact removal, free totals and locale are preserved', async () => {
  const api = createRetailFixture(createSession('b2c'))
  const line = { productId: fixtureId(109), quantity: 10000 }
  assert.equal((await api.setQuantity(line)).itemCount, 10000)
  assert.equal((await api.setQuantity({ ...line, quantity: 2 })).itemCount, 2)
  const cart = await api.cart(false, { language: 'ar' })
  assert.equal(cart.subtotal, 0)
  assert.equal(cart.canCheckout, true)
  assert.equal(cart.items[0].name, 'بلوزة قطن يومية')
  assert.equal((await api.setQuantity({ ...line, quantity: 0 })).items.length, 0)
  await assert.rejects(api.setQuantity({ ...line, quantity: 10001 }))
})
test('successful customer merge consumes guest quantities once and isolates accounts', async () => {
  const session = createSession('b2c'),
    api = createRetailFixture(session)
  await api.setQuantity({ productId: fixtureId(101), quantity: 3 })
  customer(session)
  await api.setQuantity({ productId: fixtureId(101), quantity: 2 })
  assert.equal((await api.merge()).itemCount, 5)
  assert.equal((await api.merge()).itemCount, 5)
  assert.equal((await api.cart(true)).itemCount, 0)
  customer(session, 'customer-b')
  assert.equal((await api.cart()).itemCount, 0)
  customer(session)
  assert.equal((await api.cart()).itemCount, 5)
})
test('failed merge preserves both owners and can recover without dropping selections', async () => {
  const session = createSession('b2c'),
    api = createRetailFixture(session)
  const line = { productId: fixtureId(100), variantId: fixtureId(210), quantity: 8 }
  await api.setQuantity(line)
  customer(session)
  await api.setQuantity(line)
  await assert.rejects(api.merge(), (error) => error.code === 'CART_MERGE_CONFLICT')
  assert.equal((await api.cart()).itemCount, 8)
  assert.equal((await api.cart(true)).itemCount, 8)
  await api.setQuantity({ ...line, quantity: 4 }, true)
  assert.equal((await api.merge()).itemCount, 12)
})
test('Wishlist is customer-only, product-level, idempotent and account-isolated', async () => {
  const session = createSession('b2c'),
    api = createRetailFixture(session)
  await assert.rejects(api.wishlist())
  customer(session)
  await api.save(fixtureId(100))
  assert.equal((await api.save(fixtureId(100))).itemCount, 1)
  customer(session, 'customer-b')
  assert.equal((await api.wishlist()).itemCount, 0)
  customer(session)
  assert.equal((await api.save(fixtureId(100), true)).itemCount, 0)
})
test('live adapter keeps guest Authorization absent and sends customer merge with no body', async () => {
  const session = createSession('b2c'),
    calls = []
  const config = { mode: 'live', store: 'b2c', apiOrigin: 'https://api.example.test' }
  const transport = createApi(config, {
    getToken: () => session.getSnapshot().accessToken,
    fetcher: async (url, options) => {
      calls.push({ url, options })
      return new Response(
        JSON.stringify({
          success: true,
          code: 'OK',
          data: { items: [], itemCount: 0, subtotal: 0, currency: 'EGP', canCheckout: false },
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    },
  })
  const api = createRetailApi({ config, api: transport, session })
  customer(session)
  await api.cart(true)
  await api.cart()
  await api.merge()
  assert.equal(calls[0].options.headers.has('authorization'), false)
  assert.equal(calls[1].options.headers.get('authorization'), 'Bearer test-token')
  assert.equal(calls[2].url, 'https://api.example.test/api/v1/b2c/cart/merge')
  assert.equal(calls[2].options.method, 'POST')
  assert.equal(calls[2].options.body, undefined)
  assert.ok(calls.every((call) => call.options.credentials === 'include'))
  customer(session, 'staff', 'admin')
  assert.throws(
    () => api.cart(),
    (error) => error.code === 'FORBIDDEN',
  )
  await assert.rejects(
    api.setQuantity({ productId: fixtureId(100), quantity: 1 }),
    (error) => error.code === 'FORBIDDEN',
  )
})
test('mutation Retry-After blocks immediate repeat requests without replay', async () => {
  const session = createSession('b2c'),
    config = { mode: 'live', store: 'b2c', apiOrigin: 'https://api.example.test' }
  let calls = 0
  const transport = createApi(config, {
    fetcher: async () => {
      calls++
      return new Response(
        JSON.stringify({ success: false, code: 'TOO_MANY_REQUESTS', message: 'Wait' }),
        { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '10' } },
      )
    },
  })
  const api = createRetailApi({ config, api: transport, session })
  const body = { productId: fixtureId(100), quantity: 2 }
  await assert.rejects(api.setQuantity(body), (error) => error.retryAfter === 10)
  await assert.rejects(
    api.setQuantity(body),
    (error) => error.status === 429 && error.retryAfter > 0,
  )
  assert.equal(calls, 1)
})
