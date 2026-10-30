import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { nameSlug, offerSlugs } from '../lib/offer-slugs.js'

const pageNames = {
  '': 'index',
  '/services/spinning': 'spinning',
  '/services/weaving': 'weaving',
  '/services/fabric': 'fabric-manufacturing',
  '/services/school-uniforms': 'school-uniforms',
  '/about': 'about-narmer',
}

export function pageFile(language, path, title = '') {
  if (
    !['en', 'ar'].includes(language) ||
    !/^\/(?:[a-z0-9-]+\/?)*$/i.test(path || '/') ||
    (path.endsWith('/') && path !== '')
  ) {
    throw new Error(`Invalid public page: ${language}:${path}`)
  }
  const slug = nameSlug(title)
  const name =
    path.startsWith('/wholesale/offers/') && slug
      ? `wholesale-${slug}`
      : pageNames[path] || path.slice(1).replaceAll('/', '-')
  return `${language === 'ar' ? 'ar/' : ''}${name}.html`
}

export function publicFiles(pages) {
  const slugs = offerSlugs(pages.flatMap((page) => (page.data?.offer ? [page.data.offer] : [])))
  return new Map(
    pages.map((page) => [
      page.path,
      page.data?.offer
        ? `wholesale-${slugs[page.data.offer.id]}.html`
        : page.data?.product
          ? pageFile('en', page.path).replace(/^products-/, 'product-')
          : pageFile('en', page.path),
    ]),
  )
}

export const assetOutput = {
  entryFileNames: (chunk) =>
    chunk.name === 'entry-server' ? 'entry-server.js' : 'assets/js/[name]-[hash].js',
  chunkFileNames: 'assets/js/[name]-[hash].js',
  assetFileNames: (asset) => {
    const name = asset.names?.[0] || asset.originalFileNames?.[0] || ''
    const folder = /\.css$/i.test(name)
      ? 'css'
      : /\.(?:woff2?|ttf|otf)$/i.test(name)
        ? 'fonts'
        : 'images'
    return `assets/${folder}/[name]-[hash][extname]`
  },
}

// Clean URLs serve the same named HTML files; private/dynamic routes use the app shell.
export function organizedPreview() {
  return {
    name: 'narmer-organized-preview',
    configurePreviewServer(server) {
      const routes = JSON.parse(
        readFileSync(
          resolve(server.config.root, server.config.build.outDir, 'routes.json'),
          'utf8',
        ),
      )
      server.middlewares.use((request, response, next) => {
        if (!['GET', 'HEAD'].includes(request.method)) return next()
        const url = new URL(request.url, 'http://localhost')
        const path = url.pathname.replace(/\/$/, '') || '/'
        if (path.startsWith('/api/')) return next()
        const redirect = routes.redirects?.[path]
        if (redirect) {
          response.writeHead(308, { Location: `${redirect}${url.search}` })
          response.end()
          return
        }
        const file = routes.rewrites[path]
        if (file || (!path.split('/').at(-1).includes('.') && !path.startsWith('/assets/'))) {
          request.url = `${file || '/app.html'}${url.search}`
        }
        next()
      })
    },
  }
}
