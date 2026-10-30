import { renderStatic } from '../../shared/lib/static-render.js'
import { StaticRouter } from 'react-router'
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary.jsx'
import App from './App.jsx'
import { config } from './app/config.js'
import { createApi } from '../../shared/lib/api.js'
import { createSession } from '../../shared/lib/session.js'
import { createRetailApi } from './features/shop/api.js'
import { retailImages } from './features/shop/images.js'
import { productPath } from './features/shop/catalog.js'

export const indexingOrigin = config.mode === 'live' && config.apiOrigin ? config.siteOrigin : ''
export async function publicPages(language) {
  const api = createRetailApi({
    config,
    api: createApi(config),
    session: createSession('b2c'),
    images: retailImages,
  })
  if (config.mode !== 'fixtures' && !(config.mode === 'live' && config.apiOrigin))
    return ['', '/products', '/about', '/contact', '/privacy', '/terms'].map((path) => ({ path }))
  const options = { language, signal: AbortSignal.timeout(15000) }
  const [categories, homepage, settings, list, facets] = await Promise.all([
    api.categories(options),
    api.homepage(options),
    api.settings(options),
    api.products(new URLSearchParams({ limit: '12' }), options),
    api.facets(new URLSearchParams(), options),
  ])
  const data = { language, categories, homepage, settings, list, facets }
  const catalog = await api.products(new URLSearchParams({ limit: '100' }), options)
  for (let page = 2; page <= catalog.pagination.pages; page++) {
    const next = await api.products(new URLSearchParams({ limit: '100', page: String(page) }), {
      language,
      signal: AbortSignal.timeout(15000),
    })
    catalog.items.push(...next.items)
  }
  return ['', '/products', '/about', '/contact', '/privacy', '/terms']
    .map((path) => ({ path, data }))
    .concat(
      catalog.items.map((product) => ({
        path: productPath(product),
        data: {
          ...data,
          product,
          related: { items: catalog.items.filter((item) => item.id !== product.id).slice(0, 4) },
        },
      })),
    )
}

export function render(url, publicData) {
  return renderStatic(
    <ErrorBoundary>
      <StaticRouter location={url}>
        <App publicData={publicData} />
      </StaticRouter>
    </ErrorBoundary>,
  )
}
