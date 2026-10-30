import { useLocale } from './Locale.jsx'

export function Metadata({
  config,
  title,
  description,
  keywords,
  structuredData,
  path = '',
  publicPage = false,
}) {
  const language = useLocale(),
    origin = config.siteOrigin
  const indexable = publicPage && config.mode === 'live' && Boolean(origin)
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={indexable ? 'index, follow' : 'noindex, nofollow'} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={language === 'ar' ? 'ar_EG' : 'en_EG'} />
      <meta name="twitter:card" content="summary" />
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
      )}
      {origin && (
        <>
          <link rel="canonical" href={`${origin}/${language}${path}`} />
          <meta property="og:url" content={`${origin}/${language}${path}`} />
          {publicPage &&
            ['en', 'ar'].map((lang) => (
              <link key={lang} rel="alternate" hrefLang={lang} href={`${origin}/${lang}${path}`} />
            ))}
        </>
      )}
    </>
  )
}
