import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assignProductImage,
  moveProductImage,
  productImages,
  removeProductImage,
  variantImages,
} from '../../B2C-Website/src/features/dashboard/product-images.js'
import { productPayload } from '../../B2C-Website/src/features/dashboard/catalog.js'
import { createCatalogFixture } from '../../B2C-Website/src/features/dashboard/catalog-fixtures.js'

const image = (id) => ({ id, url: `/${id}.webp`, width: 100, height: 100 })
const product = () => ({
  id: 'product',
  type: 'variant',
  version: 2,
  images: [image('shared')],
  options: [
    {
      key: 'size',
      name: { en: 'Size' },
      values: [
        { key: 'm', name: { en: 'M' } },
        { key: 'l', name: { en: 'L' } },
      ],
    },
  ],
  variants: [
    { id: 'm', values: { size: 'm' }, images: [], price: 100, stock: 2 },
    {
      id: 'l',
      values: { size: 'l' },
      images: [image('shared'), image('large')],
      price: 100,
      stock: 3,
    },
  ],
})

test('size-specific images retain shared photos, variant identities, and the original draft', () => {
  const original = product(),
    before = structuredClone(original),
    changed = assignProductImage(original, image('extra'), { main: false, targets: [0] })
  assert.deepEqual(original, before)
  assert.deepEqual(
    changed.variants.map((v) => v.id),
    ['m', 'l'],
  )
  assert.deepEqual(
    changed.variants.map((v) => v.images.map((i) => i.id)),
    [
      ['shared', 'extra'],
      ['shared', 'large'],
    ],
  )
  assert.deepEqual(productPayload(changed, original).imageIds, ['shared'])
  assert.deepEqual(productPayload(changed, original).variants[0].imageIds, ['shared', 'extra'])
  assert.deepEqual(
    productImages(changed).map((i) => i.id),
    ['shared', 'extra', 'large'],
  )
})

test('image assignment rejects fallback leaks and gallery limits without changing the draft', () => {
  const original = product(),
    before = structuredClone(original)
  assert.throws(
    () => assignProductImage(original, image('shared'), { main: true, targets: [1] }),
    /another image for M/,
  )
  const full = { ...original, images: Array.from({ length: 10 }, (_, i) => image(`image-${i}`)) }
  assert.throws(
    () => assignProductImage(full, image('overflow'), { main: false, targets: [0] }),
    /10 images/,
  )
  assert.deepEqual(original, before)
})

test('shared image edits and removal reach every reference without duplicate IDs', () => {
  const original = product(),
    before = structuredClone(original),
    assigned = assignProductImage(original, image('large'), { main: false, targets: [0, 1] }),
    reordered = moveProductImage(assigned, 'large', -1, '0'),
    removed = removeProductImage(reordered, 'shared')
  assert.deepEqual(
    reordered.variants.map((v) => v.images.map((i) => i.id)),
    [
      ['large', 'shared'],
      ['shared', 'large'],
    ],
  )
  assert.deepEqual(removed.images, [])
  assert.deepEqual(
    removed.variants.map((v) => v.images.map((i) => i.id)),
    [['large'], ['large']],
  )
  assert.deepEqual(original, before)
  assert.deepEqual(variantImages(original, original.variants[0]), original.images)
  assert.equal(moveProductImage(original, 'shared', -1, '99'), original)
})

test('review fixture shares saved image IDs across galleries on the same product only', async () => {
  const original = product(),
    other = { ...product(), id: 'other' },
    fixture = createCatalogFixture([original, other])
  const draft = assignProductImage(original, image('large'), { main: true, targets: [0, 1] })
  const saved = await fixture('/products/product', {
    method: 'PATCH',
    body: productPayload(draft, original),
  })
  assert.deepEqual(
    saved.images.map((i) => i.id),
    ['shared', 'large'],
  )
  assert.deepEqual(
    saved.variants[0].images.map((i) => i.id),
    ['shared', 'large'],
  )
  await assert.rejects(
    fixture('/products/other', { method: 'PATCH', body: { version: 2, imageIds: ['not-owned'] } }),
    { code: 'MEDIA_CONFLICT' },
  )
})
