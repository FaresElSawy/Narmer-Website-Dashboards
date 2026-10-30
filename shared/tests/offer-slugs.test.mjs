import test from 'node:test'
import assert from 'node:assert/strict'
import { nameSlug, offerSlugs, offerKeys } from '../lib/offer-slugs.js'
import { createInquiryApi } from '../../B2B-Website/src/features/inquiry/api.js'
import { createReviewInquiry } from '../../B2B-Website/src/features/inquiry/fixtures.js'

const id = '0000000000000000000001f4'
test('saved offer URLs survive name and list-order changes; invalid or colliding keys fail closed', () => {
  const items = [
    { id, name: 'Renamed hoodie', slug: 'logo-hoodie', slugAliases: ['first-hoodie'] },
    {
      id: '0000000000000000000001f5',
      name: 'Renamed hoodie',
      slug: 'logo-hoodie-2',
      slugAliases: [],
    },
  ]
  const slugs = offerSlugs(items)
  assert.equal(slugs[id], 'logo-hoodie')
  assert.deepEqual(offerSlugs(items.toReversed()), slugs)
  assert.deepEqual(offerKeys(items[0]), ['logo-hoodie', 'first-hoodie'])
  assert.equal(nameSlug('  Café / Zip Sweatshirt! '), 'cafe-zip-sweatshirt')
  for (const slug of [undefined, '', '../private', 'https://example.test', id, 'Uppercase'])
    assert.throws(() => offerSlugs([{ ...items[0], slug }]))
  assert.throws(() => offerSlugs([{ id, slug: 'missing-aliases' }]))
  assert.throws(() => offerSlugs([items[0], { ...items[1], slug: 'first-hoodie' }]))
  assert.throws(() => offerSlugs([{ ...items[0], slugAliases: ['logo-hoodie'] }]))
})

test('public key resolution makes one localized resolver request; inquiry detail remains ID-only', async () => {
  const calls = [],
    runtime = {
      config: { mode: 'live', store: 'b2b', apiOrigin: 'https://api.example.test' },
      session: { getSnapshot: () => ({ user: null }) },
      api: {
        request: async (path, options) => {
          calls.push({ path, options })
          return {
            id,
            version: 1,
            isAvailable: true,
            isActive: true,
            name: 'Renamed',
            slug: 'logo-hoodie',
            slugAliases: ['first-hoodie'],
          }
        },
      },
    },
    api = createInquiryApi(runtime, () => 'ar', {})
  const resolved = await api.resolveOffer('FIRST-HOODIE', new AbortController().signal)
  assert.equal(resolved.slug, 'logo-hoodie')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/wholesale/offers/resolve/FIRST-HOODIE')
  assert.equal(calls[0].options.language, 'ar')
  assert.equal(calls[0].options.authenticated, undefined)
  await api.offer(id)
  assert.equal(calls[1].path, '/wholesale/offers/' + id)
  assert.throws(() => api.offer('logo-hoodie'), /VALIDATION_ERROR/)
  await assert.rejects(api.resolveOffer('../private'), { code: 'WHOLESALE_OFFER_NOT_FOUND' })
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(api.resolveOffer('logo-hoodie', controller.signal), { name: 'AbortError' })
  assert.equal(calls.length, 2)
  runtime.api.request = async () => ({ id })
  await assert.rejects(api.resolveOffer('logo-hoodie'), { code: 'INVALID_RESPONSE' })
  for (const invalid of [{}, { id }, { id, version: 1 }, { id, version: 1, isActive: true }]) {
    runtime.api.request = async () => ({ slug: 'logo-hoodie', slugAliases: [], ...invalid })
    await assert.rejects(api.resolveOffer('logo-hoodie'), { code: 'INVALID_RESPONSE' })
  }
})

test('review canonical URLs stay fixed after renaming and resolve aliases and IDs in both languages', async () => {
  const review = createReviewInquiry({ images: {} }),
    item = review.staffData.offers[0]
  item.name.en = 'A new name'
  item.slugAliases.push('old-name')
  for (const language of ['en', 'ar']) {
    for (const key of [item.slug, item.id, 'OLD-NAME']) {
      const result = await review.resolveOffer(key, language)
      assert.equal(result.id, item.id)
      assert.equal(result.slug, 'logo-hoodie')
    }
  }
  item.isActive = false
  await assert.rejects(review.resolveOffer('old-name', 'en'), { code: 'WHOLESALE_OFFER_NOT_FOUND' })
})
