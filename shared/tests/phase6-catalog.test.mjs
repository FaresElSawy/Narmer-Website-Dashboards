import test from 'node:test'
import assert from 'node:assert/strict'
import {
  categoryPayload,
  emptyProduct,
  productPayload,
  sizeChartPayload,
  validateMeasurements,
} from '../../B2C-Website/src/features/dashboard/catalog.js'
import { createCatalogFixture } from '../../B2C-Website/src/features/dashboard/catalog-fixtures.js'

test('product type remains immutable and money stays integer piastres', () => {
  const draft = {
    ...emptyProduct(),
    categoryId: 'c',
    name: { en: 'A', ar: 'ب' },
    slug: 'a',
    price: '25000',
    stock: '2',
    discountedPrice: '0',
  }
  assert.equal(productPayload(draft, { ...draft, version: 0 }).discountedPrice, 0)
  assert.throws(
    () =>
      productPayload(
        { ...draft, type: 'variant' },
        { ...draft, id: '000000000000000000000001', version: 0 },
      ),
    /cannot be changed/i,
  )
  assert.throws(
    () => productPayload({ ...draft, price: '1.5' }, { ...draft, version: 0 }),
    /whole numbers/i,
  )
})

test('measurement rules enforce row labels, bounds, and decimal precision', () => {
  const measurements = {
    unit: 'cm',
    rows: [{ size: 'M', chest: '52.5', length: '70', sleeve: '21.1' }],
  }
  assert.equal(validateMeasurements(measurements).rows[0].sleeve, 21.1)
  assert.equal(measurements.rows[0].sleeve, '21.1')
  assert.throws(
    () =>
      validateMeasurements({
        unit: 'cm',
        rows: [
          { size: 'M', chest: 10, length: 10, sleeve: 10 },
          { size: 'm', chest: 10, length: 10, sleeve: 10 },
        ],
      }),
    /size label/i,
  )
  assert.throws(
    () =>
      validateMeasurements({
        unit: 'cm',
        rows: [{ size: 'M', chest: 1000.001, length: 10, sleeve: 10 }],
      }),
    /chest/i,
  )
})

test('variant writes preserve IDs and reject missing or duplicate combinations', () => {
  const draft = {
    ...emptyProduct('variant'),
    options: [
      {
        key: 'size',
        name: { en: 'Size', ar: 'المقاس' },
        values: [{ key: 'xxl', name: { en: 'XXL', ar: 'XXL' } }],
      },
    ],
    variants: [{ id: 'existing-variant', values: { size: 'xxl' }, price: 100, stock: 2 }],
  }
  assert.equal(productPayload(draft, draft).variants[0].id, 'existing-variant')
  assert.throws(() => productPayload({ ...draft, variants: [] }, draft), /sellable variants/)
  assert.throws(
    () =>
      productPayload(
        { ...draft, variants: [...draft.variants, { ...draft.variants[0], id: undefined }] },
        draft,
      ),
    /different option combination/,
  )
  assert.throws(
    () =>
      productPayload(
        { ...draft, variants: [{ ...draft.variants[0], values: { size: 'missing' } }] },
        draft,
      ),
    /configured value/,
  )
})

test('catalog fixture rejects cross-target media and protects referenced deletes', async () => {
  const fixture = createCatalogFixture(),
    products = (await fixture('/products')).items
  const [first, other] = products
  const image = await fixture(`/media/product/${first.id}`, {
    method: 'POST',
    body: new Blob(['x']),
  })
  await assert.rejects(
    fixture(`/products/${other.id}`, {
      method: 'PATCH',
      body: { version: other.version, imageIds: [image.id] },
    }),
    { code: 'MEDIA_CONFLICT', status: 409 },
  )
  const categoryImage = await fixture('/media/category/00000000000000000000000a', {
    method: 'POST',
    body: new Blob(['x']),
  })
  await assert.rejects(
    fixture('/categories/00000000000000000000000b', {
      method: 'PATCH',
      body: { imageId: categoryImage.id },
    }),
    { code: 'MEDIA_CONFLICT', status: 409 },
  )
  const chartId = '0000000000000000000002bc'
  const englishImage = await fixture(`/size-charts/${chartId}/images/en`, {
    method: 'POST',
    body: new Blob(['x']),
  })
  await assert.rejects(
    fixture(`/size-charts/${chartId}`, {
      method: 'PATCH',
      body: { version: 0, imageIds: { ar: englishImage.id } },
    }),
    { code: 'MEDIA_CONFLICT', status: 409 },
  )
  await assert.rejects(fixture('/categories/00000000000000000000000a', { method: 'DELETE' }), {
    code: 'CATEGORY_HAS_CHILDREN',
    status: 409,
  })
  await assert.rejects(fixture(`/size-charts/${chartId}`, { method: 'DELETE' }), {
    code: 'SIZE_CHART_IN_USE',
    status: 409,
  })
})

test('category updates contain only changed fields and chart updates retain chart version', () => {
  const category = {
    name: { en: 'Old', ar: 'قديم' },
    slug: 'old',
    description: { en: '', ar: '' },
    parentId: null,
    position: 0,
    isActive: false,
    image: null,
  }
  assert.deepEqual(categoryPayload({ ...category, name: { en: 'New', ar: 'قديم' } }, category), {
    name: { en: 'New', ar: 'قديم' },
  })
  const chart = {
    version: 4,
    name: { en: 'Size', ar: 'مقاس' },
    alt: { en: '', ar: '' },
    isActive: false,
    images: { en: null, ar: null },
    measurements: null,
  }
  assert.equal(
    sizeChartPayload(
      {
        ...chart,
        measurements: { unit: 'cm', rows: [{ size: 'M', chest: 50, length: 60, sleeve: 20 }] },
      },
      chart,
    ).version,
    4,
  )
})
