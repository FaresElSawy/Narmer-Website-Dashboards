import test from 'node:test'
import assert from 'node:assert/strict'
import {
  categoryPayload,
  emptyProduct,
  productPayload,
  sizeChartPayload,
  updateCatalogName,
  newProductOption,
  newProductOptionValue,
  updateOptionName,
  updateOptionValueName,
  validateMeasurements,
} from '../../B2C-Website/src/features/dashboard/catalog.js'
import { createCatalogFixture } from '../../B2C-Website/src/features/dashboard/catalog-fixtures.js'
import { productFieldErrors } from '../../B2C-Website/src/features/dashboard/product-validation.js'

test('generated option keys follow English names and preserve variant selections through edits', () => {
  const option = newProductOption(),
    value = option.values[0]
  let draft = {
    ...emptyProduct('variant'),
    options: [option],
    variants: [{ values: { [option.key]: value.key }, price: 22200, stock: 1 }],
  }
  draft = updateOptionName(draft, 0, { en: 'Color', ar: 'اللون' })
  draft = updateOptionValueName(draft, 0, 0, { en: 'Red', ar: 'أحمر' })
  assert.equal(draft.options[0].key, 'color')
  assert.equal(draft.options[0].values[0].key, 'red')
  assert.deepEqual(draft.variants[0].values, { color: 'red' })
  draft = updateOptionName(draft, 0, { en: 'Fabric color', ar: 'لون القماش' })
  draft = updateOptionValueName(draft, 0, 0, { en: 'Dark Red', ar: 'أحمر داكن' })
  assert.deepEqual(draft.variants[0].values, { 'fabric-color': 'dark-red' })
  assert.equal(option.key.startsWith('option-'), true)
  const body = productPayload(draft, emptyProduct('variant'))
  assert.equal('editorKey' in body.options[0], false)
  assert.equal('editorKey' in body.options[0].values[0], false)
  assert.equal('editorKey' in body.variants[0], false)
})

test('new keys avoid collisions, reserved names and invalid prefixes without changing saved keys', () => {
  let draft = { ...emptyProduct('variant'), options: [newProductOption(), newProductOption()] }
  draft = updateOptionName(draft, 0, { en: 'Color', ar: 'اللون' })
  draft = updateOptionName(draft, 1, { en: 'Color', ar: 'اللون' })
  assert.deepEqual(
    draft.options.map((item) => item.key),
    ['color', 'color-2'],
  )
  draft.options[0].values.push(newProductOptionValue())
  draft = updateOptionValueName(draft, 0, 0, { en: 'Red', ar: 'أحمر' })
  draft = updateOptionValueName(draft, 0, 1, { en: 'Red', ar: 'أحمر' })
  assert.deepEqual(
    draft.options[0].values.map((item) => item.key),
    ['red', 'red-2'],
  )
  for (const title of ['constructor', '123 size', 'Very long color '.repeat(8), 'لون']) {
    draft = updateOptionName(draft, 1, { en: title, ar: 'خيار' })
    assert.match(draft.options[1].key, /^[a-z][a-z0-9_-]{0,39}$/)
    assert.notEqual(draft.options[1].key, 'constructor')
  }
  const saved = {
    ...emptyProduct('variant'),
    options: [
      {
        key: 'size',
        name: { en: 'Size', ar: 'المقاس' },
        values: [{ key: 'xl', name: { en: 'XL', ar: 'XL' } }],
      },
    ],
    variants: [{ id: 'saved', values: { size: 'xl' } }],
  }
  const renamed = updateOptionValueName(
    updateOptionName(saved, 0, { en: 'New size label', ar: 'مقاس' }),
    0,
    0,
    { en: 'Extra large', ar: 'كبير' },
  )
  assert.equal(renamed.options[0].key, 'size')
  assert.equal(renamed.options[0].values[0].key, 'xl')
  assert.deepEqual(renamed.variants, saved.variants)
})

test('product validation identifies exact missing fields and handles zero, invalid money and stock', () => {
  const draft = {
    ...emptyProduct(),
    name: { en: 'Shirt', ar: 'قميص' },
    slug: 'shirt',
    categoryId: 'c',
    price: 0,
    stock: 0,
  }
  assert.deepEqual(productFieldErrors(draft), {})
  const errors = productFieldErrors({
    ...draft,
    name: { en: ' ', ar: '' },
    slug: 'Bad Slug',
    categoryId: '',
    price: NaN,
    stock: '',
  })
  for (const path of ['name.en', 'name.ar', 'slug', 'categoryId', 'price', 'stock'])
    assert.ok(errors[path], path)
  assert.match(productFieldErrors({ ...draft, discountedPrice: 0 }).discountedPrice, /lower/)
  assert.ok(productFieldErrors({ ...draft, stock: 1.5 }).stock)
  assert.match(productFieldErrors(emptyProduct(), 'ar')['name.en'], /مطلوب/)
})

test('variant validation identifies translations, selection, duplicate, price and stock fields', () => {
  const draft = {
    ...emptyProduct('variant'),
    name: { en: 'Shirt', ar: 'قميص' },
    slug: 'shirt',
    categoryId: 'c',
    options: [
      {
        key: 'color',
        name: { en: 'Color', ar: '' },
        values: [{ key: 'red', name: { en: 'Red', ar: '' } }],
      },
    ],
    variants: [
      { values: { color: 'red' }, price: 22200, stock: 1 },
      { values: { color: 'red' }, price: '', stock: -1 },
    ],
  }
  const errors = productFieldErrors(draft)
  for (const path of [
    'options.0.name.ar',
    'options.0.values.0.name.ar',
    'variants.0.values',
    'variants.1.values',
    'variants.1.price',
    'variants.1.stock',
  ])
    assert.ok(errors[path], path)
  assert.ok(
    productFieldErrors({
      ...draft,
      variants: [{ ...draft.variants[0], values: { color: 'missing' } }],
    })['variants.0.values.color'],
  )
  assert.ok(productFieldErrors({ ...draft, options: [], variants: [] }).options)
  assert.ok(productFieldErrors({ ...draft, options: [], variants: [] }).variants)
})

test('new catalog slugs follow only the English name and respect URL limits', () => {
  let draft = emptyProduct()
  draft = updateCatalogName(draft, { en: '', ar: 'هودي نارمر' }, true)
  assert.equal(draft.slug, '')
  draft = updateCatalogName(draft, { ...draft.name, en: '  Narmer Hoodie — Pink!  ' }, true)
  assert.equal(draft.slug, 'narmer-hoodie-pink')
  draft = updateCatalogName(draft, { ...draft.name, en: 'Café Cotton & Linen' }, true)
  assert.equal(draft.slug, 'cafe-cotton-and-linen')
  draft = updateCatalogName(draft, { ...draft.name, en: 'Cotton '.repeat(30) }, true)
  assert.ok(draft.slug.length <= 150)
  assert.match(draft.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  draft = updateCatalogName(draft, { ...draft.name, en: '' }, true)
  assert.equal(draft.slug, '')
})

test('catalog renames preserve custom and already saved slugs', () => {
  const draft = {
    ...emptyProduct(),
    name: { en: 'Hoodies', ar: 'هودي' },
    slug: 'mens-hoodies',
  }
  assert.equal(
    updateCatalogName(draft, { ...draft.name, en: 'Cotton hoodies' }, true).slug,
    draft.slug,
  )
  assert.equal(updateCatalogName(draft, { ...draft.name, ar: 'هوديز' }, true).slug, draft.slug)
  const saved = { ...draft, id: '000000000000000000000001', slug: 'hoodies' }
  assert.equal(
    updateCatalogName(saved, { ...saved.name, en: 'Cotton hoodies' }, false).slug,
    saved.slug,
  )
})

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
