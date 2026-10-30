import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { useRuntime } from '../../../../shared/ui/Runtime.jsx'
import { reviewInquiry } from '../inquiry/api.js'
import { reviewImages } from '../inquiry/review-images.js'
import { localText } from '../inquiry/model.js'

const ContentContext = createContext({ home: null, settings: null, readErrors: {}, loading: false })
const emptySettings = {
  phone: null,
  email: null,
  address: '',
  mapUrl: null,
  social: { instagramUrl: null, whatsappUrl: null, tiktokUrl: null, facebookUrl: null },
  seo: { title: '', description: '', keywords: '' },
}
const fixtureHomepage = {
  store: 'b2b',
  slots: [
    'hero',
    'service-spinning',
    'service-weaving',
    'service-fabric',
    'service-school-uniforms',
    'service-wholesale',
    'wholesale-overview',
  ].map((key) => ({ key, desktopImage: null, mobileImage: null, alt: '' })),
  updatedAt: null,
}

export function BusinessContentProvider({ children, publicData }) {
  const { api, config, session, hasPublicContentChanges } = useRuntime()
  const language = useLocale()
  const bootstrapUsed = useRef(false)
  const [content, setContent] = useState(() =>
    publicData?.language === language
      ? {
          language,
          home: publicData.homepage ?? null,
          settings: publicData.settings ?? null,
          readErrors: {},
        }
      : { language: null, home: null, settings: null, readErrors: {} },
  )
  const bootstrapMatches = publicData?.language === language && !hasPublicContentChanges()

  useEffect(() => {
    let active = true
    if (bootstrapMatches && !bootstrapUsed.current) {
      bootstrapUsed.current = true
      return () => {
        active = false
      }
    }
    if (config.mode === 'fixtures' || config.mode !== 'live' || !config.apiOrigin)
      return () => {
        active = false
      }
    const controller = new AbortController()
    Promise.allSettled([
      api.request('/homepage', { signal: controller.signal, language }),
      api.request('/site-settings', { signal: controller.signal, language }),
    ]).then(([homepage, settings]) => {
      if (!active) return
      setContent({
        language,
        home: homepage.status === 'fulfilled' ? homepage.value : null,
        settings: settings.status === 'fulfilled' ? settings.value : null,
        readErrors: {
          homepage: homepage.status === 'rejected' ? homepage.reason : null,
          settings: settings.status === 'rejected' ? settings.reason : null,
        },
      })
    })
    return () => {
      active = false
      controller.abort()
    }
  }, [api, bootstrapMatches, config.apiOrigin, config.mode, language])

  const reviewData =
    config.mode === 'fixtures' ? reviewInquiry(session, reviewImages).staffData : null
  const reviewContent = reviewData?.homepage
    ? {
        language,
        readErrors: {},
        home: {
          store: 'b2b',
          slots: reviewData.homepage.slots.map((slot) => ({
            ...slot,
            alt: localText(slot.alt, language),
          })),
          updatedAt: reviewData.homepage.updatedAt,
        },
        settings: {
          ...reviewData.settings,
          address: localText(reviewData.settings.address, language),
          seo: {
            ...reviewData.settings.seo,
            title: localText(reviewData.settings.seo.title, language),
            description: localText(reviewData.settings.seo.description, language),
          },
        },
      }
    : null
  const current =
    reviewContent ||
    (content.language === language ? content : null) ||
    (config.mode === 'fixtures'
      ? { language, home: fixtureHomepage, settings: emptySettings, readErrors: {} }
      : null)
  return (
    <ContentContext.Provider
      value={
        current || {
          language,
          home: null,
          settings: null,
          readErrors: {},
          loading: config.mode === 'live' && Boolean(config.apiOrigin),
        }
      }
    >
      {children}
    </ContentContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function useBusinessContent() {
  return useContext(ContentContext)
}
