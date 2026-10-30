import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { pageFile, publicFiles } from './site-layout.mjs'
import { offerKeys, offerSlugs } from '../lib/offer-slugs.js'

// Render only approved public routes at build time; no application server is shipped.
const app = process.cwd()
const output = resolve(
  app,
  process.argv.includes('--outDir') ? process.argv[process.argv.indexOf('--outDir') + 1] : 'dist',
)
const mode = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : 'production'
execFileSync(
  process.execPath,
  [
    resolve(app, 'node_modules/vite/bin/vite.js'),
    'build',
    '--ssr',
    'src/entry-server.jsx',
    '--outDir',
    '.prerender',
    '--mode',
    mode,
  ],
  { stdio: 'inherit' },
)
const server = await import(pathToFileURL(resolve(app, '.prerender/entry-server.js')))
const template = await readFile(resolve(output, 'index.html'), 'utf8')
await writeFile(resolve(output, 'app.html'), template)
let count = 0
const canonicalPages = []
const routes = { fallback: '/app.html', rewrites: {}, redirects: {}, pages: [] }
const englishPages = server.publicPages ? await server.publicPages('en') : [{ path: '' }]
const files = publicFiles(englishPages)
const slugs = offerSlugs(
  englishPages.flatMap((page) => (page.data?.offer ? [page.data.offer] : [])),
)
for (const language of ['en', 'ar']) {
  for (const { path: originalPath, data: originalData } of language === 'en'
    ? englishPages
    : server.publicPages
      ? await server.publicPages(language)
      : [{ path: '' }]) {
    const path = originalData?.offer
      ? `/wholesale/offers/${slugs[originalData.offer.id] || originalData.offer.id}`
      : originalPath
    const data = originalData ? { ...originalData, offerSlugs: slugs } : undefined
    const markup = await server.render(`/${language}${path}`, data)
    assert.ok(
      !/<!--\$\?-->|<div hidden id="S:/.test(markup),
      `Incomplete static page: ${language}${path}`,
    )
    const head = []
    const body = markup.replace(
      /<title>[\s\S]*?<\/title>|<meta\b[^>]*\/>|<link\b[^>]*\/>/g,
      (tag) => {
        head.push(tag)
        return ''
      },
    )
    assert.match(body, /<h1\b[^>]*>[^<]+<\/h1>/)
    assert.match(head.join(''), /name="robots"/)
    const route = `/${language}${path}`,
      file = `${language === 'ar' ? 'ar/' : ''}${files.get(originalPath) || pageFile('en', originalPath, data?.offer?.name)}`
    assert.ok(
      !routes.pages.some((page) => page.file === file),
      `Duplicate public filename: ${file}`,
    )
    const html = template
      .replace(/<meta name="robots"[^>]*\/>/, '')
      .replace(
        '<html lang="en">',
        `<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">`,
      )
      .replace('<!--page-head-->', head.join('\n'))
      .replace(
        '<div id="root"></div>',
        `<div id="root">${body}</div>${
          data
            ? `<script type="application/json" id="narmer-public-data">${JSON.stringify(data)
                .replace(/</g, '\\u003c')
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029')}</script>`
            : ''
        }`,
      )
      .replace(
        '</body>',
        `<script type="application/json" id="narmer-page-route">${JSON.stringify(route)}</script></body>`,
      )
    for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)) {
      assert.ok(
        (await stat(resolve(output, match[1].slice(1)))).size > 0,
        `Missing built asset: ${match[1]}`,
      )
    }
    const directory = resolve(output, language === 'ar' ? 'ar' : '')
    await mkdir(directory, { recursive: true })
    await writeFile(resolve(output, file), html)
    routes.pages.push({ language, path, url: route, file })
    routes.rewrites[route] = `/${file}`
    routes.rewrites[`${route}/index.html`] = `/${file}`
    if (path !== originalPath) {
      routes.redirects[`/${language}${originalPath}`] = route
      routes.redirects[`/${language}${originalPath}/index.html`] = route
    }
    if (data?.offer) {
      for (const key of [data.offer.id, ...offerKeys(data.offer).slice(1)]) {
        const legacy = `/${language}/wholesale/offers/${key}`
        routes.redirects[legacy] = route
        routes.redirects[`${legacy}/index.html`] = route
      }
    }
    if (server.indexingOrigin && /name="robots" content="index, follow"/.test(html))
      canonicalPages.push(`${server.indexingOrigin}/${language}${path}`)
    count++
  }
}
routes.rewrites['/'] = '/index.html'
await writeFile(resolve(output, 'routes.json'), JSON.stringify(routes, null, 2))
await writeFile(
  resolve(output, 'robots.txt'),
  canonicalPages.length
    ? `User-agent: *\nAllow: /\nSitemap: ${server.indexingOrigin}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n',
)
if (canonicalPages.length)
  await writeFile(
    resolve(output, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${canonicalPages.map((url) => `<url><loc>${url.replace(/&/g, '&amp;')}</loc></url>`).join('')}</urlset>\n`,
  )
await mkdir(resolve(output, 'licenses'), { recursive: true })
await writeFile(
  resolve(output, 'licenses/poppins-OFL.txt'),
  await readFile(resolve(app, '../shared/assets/fonts/poppins/OFL.txt')),
)
console.log(
  `Public HTML proof passed: ${count} EN/AR pages contain content, metadata and valid assets. Review builds remain non-indexable.`,
)
