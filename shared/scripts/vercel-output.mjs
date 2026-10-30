import assert from 'node:assert/strict'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readConfig } from '../lib/config.js'

const escape = (path) => path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function vercelRoutes(map, store, apiOrigin) {
  assert.ok(['b2b', 'b2c'].includes(store), 'Use a supported store')
  assert.equal(new URL(apiOrigin).protocol, 'https:', 'The deployed API must use HTTPS')
  const privatePaths =
    store === 'b2c'
      ? 'dashboard|account|cart|wishlist|checkout|orders|track'
      : 'dashboard|account|request|requests|track'
  const routes = [
    { src: '/.*', headers: { 'X-Robots-Tag': 'noindex, nofollow' }, continue: true },
    {
      src: `^/api/v1/((?:admin/)?${store}(?:/.*)?)$`,
      dest: `${apiOrigin}/api/v1/$1`,
      headers: {
        'Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'x-vercel-enable-rewrite-caching': '0',
      },
    },
  ]
  if (store === 'b2b')
    routes.push({
      src: '^/api/v1/(b2c/products/[a-fA-F0-9]{24})$',
      methods: ['GET', 'HEAD'],
      dest: `${apiOrigin}/api/v1/$1`,
      headers: { 'Cache-Control': 'no-store', 'x-vercel-enable-rewrite-caching': '0' },
    })
  routes.push({ src: '^/api/.*$', status: 404 })
  for (const [path, destination] of Object.entries(map.redirects || {}))
    routes.push({ src: `^${escape(path)}/?$`, headers: { Location: destination }, status: 308 })
  for (const [path, destination] of Object.entries(map.rewrites))
    routes.push({ src: `^${escape(path)}${path === '/' ? '' : '/?'}$`, dest: destination })
  routes.push(
    { handle: 'filesystem' },
    { src: `^/(?:en|ar)/(?:${privatePaths})(?:/.*)?/?$`, dest: '/app.html' },
    {
      src:
        store === 'b2c'
          ? '^/(?:en|ar)/products/[^/.]+(?:/[^/.]+)?/?$'
          : '^/(?:en|ar)/wholesale/offers/[^/.]+/?$',
      dest: '/app.html',
    },
    { src: '/.*', dest: '/app.html', status: 404 },
  )
  return routes
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = process.cwd(),
    store = process.argv[process.argv.indexOf('--store') + 1]
  assert.equal(basename(app), store === 'b2b' ? 'B2B-Website' : 'B2C-Website')
  const require = createRequire(resolve(app, 'package.json')),
    { loadEnv } = await import(pathToFileURL(require.resolve('vite'))),
    { apiOrigin } = readConfig(loadEnv('staging', app, 'VITE_'), store),
    map = JSON.parse(await readFile(resolve(app, 'dist/routes.json'), 'utf8')),
    output = resolve(app, '.vercel/output'),
    config = { version: 3, routes: vercelRoutes(map, store, apiOrigin) }
  // Only replace this app's generated Vercel output; keep project links and local credentials.
  assert.equal(dirname(output), resolve(app, '.vercel'))
  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
  await cp(resolve(app, 'dist'), resolve(output, 'static'), {
    recursive: true,
    filter: (source) => !['routes.json', '.vite'].includes(basename(source)),
  })
  await writeFile(resolve(output, 'config.json'), `${JSON.stringify(config, null, 2)}\n`)
  console.log(`Vercel ${store} test output prepared with ${map.pages.length} public pages.`)
}
