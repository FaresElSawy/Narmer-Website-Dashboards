import test from 'node:test'
import assert from 'node:assert/strict'
import { assetOutput, pageFile, publicFiles } from '../scripts/site-layout.mjs'

test('public HTML uses named English files and the matching Arabic folder', () => {
  assert.equal(pageFile('en', ''), 'index.html')
  assert.equal(pageFile('ar', ''), 'ar/index.html')
  assert.equal(pageFile('en', '/services/spinning'), 'spinning.html')
  assert.equal(pageFile('ar', '/about'), 'ar/about-narmer.html')
  assert.equal(
    pageFile('en', '/wholesale/offers/0000000000000000000001f6'),
    'wholesale-offers-0000000000000000000001f6.html',
  )
  assert.equal(
    pageFile('en', '/wholesale/offers/0000000000000000000001f6', 'Quarter-zip sweatshirt'),
    'wholesale-quarter-zip-sweatshirt.html',
  )
  assert.equal(
    pageFile('ar', '/wholesale/offers/0000000000000000000001f6', 'Quarter-zip sweatshirt'),
    'ar/wholesale-quarter-zip-sweatshirt.html',
  )
  for (const path of ['/../private', '/about/', '//about', '/about?test=1'])
    assert.throws(() => pageFile('en', path))
  assert.throws(() => pageFile('fr', ''))
})

test('duplicate offer names retain separate files without changing route IDs', () => {
  const pages = ['0000000000000000000000a1', '0000000000000000000000a2'].map((id, index) => ({
    path: `/wholesale/offers/${id}`,
    data: {
      offer: {
        id,
        name: 'Logo hoodie',
        slug: index ? 'logo-hoodie-2' : 'logo-hoodie',
        slugAliases: [],
      },
    },
  }))
  const files = publicFiles(pages)
  assert.equal(files.get(pages[0].path), 'wholesale-logo-hoodie.html')
  assert.equal(files.get(pages[1].path), 'wholesale-logo-hoodie-2.html')
  assert.equal(publicFiles(pages.toReversed()).get(pages[0].path), files.get(pages[0].path))
})
test('retail public files keep readable names and reject unsafe paths', () => {
  assert.equal(
    publicFiles([
      { path: '/products/logo-hoodie', data: { product: { slug: 'logo-hoodie' } } },
    ]).get('/products/logo-hoodie'),
    'product-logo-hoodie.html',
  )
  assert.throws(() =>
    publicFiles([
      { path: '/products/../../private', data: { product: { slug: '../../private' } } },
    ]),
  )
})

test('bundles are sorted by asset type and retain a named server render entry', () => {
  assert.equal(
    assetOutput.assetFileNames({ names: ['site.css'] }),
    'assets/css/[name]-[hash][extname]',
  )
  assert.equal(
    assetOutput.assetFileNames({ names: ['Cairo.woff2'] }),
    'assets/fonts/[name]-[hash][extname]',
  )
  assert.equal(
    assetOutput.assetFileNames({ names: ['logo.webp'] }),
    'assets/images/[name]-[hash][extname]',
  )
  assert.equal(assetOutput.entryFileNames({ name: 'entry-server' }), 'entry-server.js')
  assert.equal(assetOutput.entryFileNames({ name: 'index' }), 'assets/js/[name]-[hash].js')
})
