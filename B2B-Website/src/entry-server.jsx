import { renderStatic } from '../../shared/lib/static-render.js'
import { StaticRouter } from 'react-router'
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary.jsx'
import App from './App.jsx'
import { config, serviceLinks } from './app/config.js'
import { createApi } from '../../shared/lib/api.js'
import { createReviewInquiry } from './features/inquiry/fixtures.js'
import logo from '../../shared/assets/images/offer-logo.webp'
import quarter from '../../shared/assets/images/offer-quarter.webp'
import men from '../../shared/assets/images/campaign-men.webp'
import women from '../../shared/assets/images/campaign-women.webp'

export const indexingOrigin = config.mode === 'live' && config.apiOrigin ? config.siteOrigin : ''

export async function publicPages(language) {
  let forms = { items: [] },
    offers = { items: [], pagination: { page: 1, limit: 8, total: 0, pages: 0 } },
    homepage = null,
    settings = null
  if (config.mode === 'fixtures') {
    const review = createReviewInquiry({ images: { logo, quarter, men, women } })
    forms = await review.forms(language)
    offers = await review.offers({ limit: 100 }, language)
  } else if (config.mode === 'live' && config.apiOrigin) {
    const api = createApi(config, { getLanguage: () => language })
    const read = (path) => api.request(path, { signal: AbortSignal.timeout(15000) })
    const results = await Promise.allSettled([read('/homepage'), read('/site-settings')])
    homepage = results[0].status === 'fulfilled' ? results[0].value : null
    settings = results[1].status === 'fulfilled' ? results[1].value : null
    forms = await read('/forms')
    offers = await read('/wholesale/offers?limit=100&page=1')
    for (let page = 2; page <= offers.pagination.pages; page++) {
      const next = await read(`/wholesale/offers?limit=100&page=${page}`)
      offers.items.push(...next.items)
    }
  }
  const data = {
    language,
    homepage,
    settings,
    forms,
    offers: {
      items: offers.items.slice(0, 8),
      pagination: {
        page: 1,
        limit: 8,
        total: offers.items.length,
        pages: Math.ceil(offers.items.length / 8),
      },
    },
  }
  return [
    '',
    ...serviceLinks(language).map((service) => service.path),
    '/contact',
    '/about',
    '/privacy',
    '/terms',
  ]
    .map((path) => ({ path, data }))
    .concat(
      offers.items.map((offer) => ({
        path: `/wholesale/offers/${offer.id}`,
        data: { ...data, offer },
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
