import { Link } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime } from '../../../shared/ui/Runtime.jsx'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { useBusinessContent } from '../features/content/BusinessContentProvider.jsx'
import { ResponsiveImage, serviceImage } from '../features/content/ServiceImage.jsx'
import { serviceLinks } from '../app/config.js'
import { steps } from '../content/services.js'
import { homeCopy } from '../content/home.js'
import spinning from '../../../shared/assets/images/spinning.webp'
import fabric from '../../../shared/assets/images/fabric.webp'
import wholesale from '../../../shared/assets/images/wholesale.webp'
import '../assets/css/business-content.css'
import { RequestStart } from './RequestStart.jsx'

function HeroMedia({ home, language }) {
  const ar = language === 'ar',
    slot = home?.slots?.find((item) => item.key === 'hero')
  const hasDesktop = Boolean(slot?.desktopImage?.url),
    hasMobile = Boolean(slot?.mobileImage?.url)
  const fallbackAlt = ar ? 'صورة توضيحية لخدمات نارمر' : 'Illustration of Narmer services'
  return (
    <div
      className={`business-media${!hasDesktop && hasMobile ? ' business-media--mobile-override' : ''}`}
    >
      {hasDesktop ? (
        <ResponsiveImage
          pictureClassName="business-home-hero-image"
          slot={slot}
          fallback={spinning}
          alt={fallbackAlt}
          width="960"
          height="640"
          fetchPriority="high"
        />
      ) : (
        <div className="business-default-media">
          <img
            className="campaign-photo"
            src={spinning}
            width="960"
            height="640"
            fetchPriority="high"
            alt={ar ? 'رسم توضيحي لمرحلة الغزل' : 'Illustration of textile spinning'}
          />
          <img
            className="campaign-photo"
            src={fabric}
            width="960"
            height="640"
            fetchPriority="high"
            alt={ar ? 'رسم توضيحي لقص الأقمشة' : 'Illustration of fabric cutting'}
          />
        </div>
      )}
      {!hasDesktop && hasMobile && (
        <ResponsiveImage
          pictureClassName="business-home-mobile-hero"
          slot={slot}
          fallback={spinning}
          alt={fallbackAlt}
          width="960"
          height="640"
          fetchPriority="high"
        />
      )}
    </div>
  )
}

function ServiceCards({ home, language }) {
  const ar = language === 'ar'
  return (
    <div className="business-service-grid">
      {serviceLinks(language).map(({ key: type, label, path }) => {
        const image = serviceImage(type, home, language)
        return (
          <Link className="business-service-card" key={type} to={`/${language}${path}`}>
            <ResponsiveImage
              slot={image.slot}
              fallback={image.fallback}
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading="lazy"
            />
            <span className="business-service-card__body">
              <strong>{label}</strong>
              <span>{ar ? 'استكشف الخدمة' : 'Explore service'}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export function BusinessHome({ requestForm }) {
  const language = useLocale(),
    ar = language === 'ar',
    copy = homeCopy[language]
  const { config } = useRuntime(),
    { home, settings } = useBusinessContent()
  return (
    <>
      <Metadata
        config={config}
        title={settings?.seo?.title || copy.metaTitle}
        description={settings?.seo?.description || copy.metaDescription}
        keywords={settings?.seo?.keywords}
        structuredData={
          config.siteOrigin
            ? {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Narmer',
                url: `${config.siteOrigin}/${language}`,
                ...(settings?.phone ? { telephone: settings.phone } : {}),
                ...(settings?.email ? { email: settings.email } : {}),
              }
            : undefined
        }
        publicPage
      />
      <section className="public-hero" aria-labelledby="business-home-title">
        <div className="campaign business-campaign">
          <div className="campaign-copy">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 id="business-home-title">{copy.title}</h1>
            <p>{copy.description}</p>
            <div className="campaign-actions">
              <Button variant="accent" to={`/${language}/wholesale`}>
                {copy.wholesale}
              </Button>
              <Button variant="accent" to={`/${language}/request`}>
                {copy.manufacturing}
              </Button>
            </div>
            <p>{copy.note}</p>
          </div>
          <HeroMedia home={home} language={language} />
        </div>
        <p className="image-caption">{copy.caption}</p>
      </section>
      <section
        className="business-section business-section--services"
        aria-labelledby="business-services-title"
      >
        <div className="business-section__heading">
          <p className="eyebrow">{ar ? 'التصنيع والتوريد' : 'MANUFACTURING & SUPPLY'}</p>
          <h2 id="business-services-title">
            {ar ? 'خدمات لكل مرحلة' : 'Services for every stage'}
          </h2>
          <p>
            {ar
              ? 'من الخيوط والأقمشة إلى الملابس المصنّعة والزي المدرسي وتوريد الجملة.'
              : 'From yarn and fabric to custom clothing, school uniforms and wholesale supply.'}
          </p>
        </div>
        <ServiceCards home={home} language={language} />
      </section>
      <section className="business-wholesale" aria-labelledby="business-wholesale-title">
        <div className="business-wholesale__panel">
          <div className="business-wholesale__image">
            <ResponsiveImage
              slot={home?.slots?.find((item) => item.key === 'wholesale-overview')}
              fallback={wholesale}
              alt={ar ? 'رسم توضيحي للملابس الجاهزة' : 'Illustration of ready-made clothing'}
              width="1200"
              height="800"
              loading="lazy"
            />
          </div>
          <div className="business-wholesale__copy">
            <p className="eyebrow">
              {ar ? 'الجملة / الملابس بالجملة' : 'WHOLESALE / BULK CLOTHING'}
            </p>
            <h2 id="business-wholesale-title">
              <span>{ar ? 'ملابس جاهزة.' : 'Ready-made supply.'}</span>
              <span>{ar ? 'توريد يلبي نشاطك.' : 'Built around your business.'}</span>
            </h2>
            <p>
              {ar
                ? 'استكشف الموديلات وتكوين العبوات المتاحة، ثم اطلب الكميات التي تحتاجها. سيتابع فريقنا معك لمناقشة متطلباتك.'
                : 'Explore available models and pouch compositions, then request the quantities you need. Our team will follow up to discuss your requirements.'}
            </p>
            <Button variant="accent" to={`/${language}/wholesale`}>
              {ar ? 'تصفح كتالوج الجملة' : 'Browse wholesale catalog'}
            </Button>
            <p className="business-wholesale__note">
              {ar
                ? 'لا توجد أسعار أو مدفوعات عبر الموقع. أرسل استفسارك وتحدث مع فريقنا.'
                : 'No online prices or payments. Submit a request and speak with our team.'}
            </p>
          </div>
        </div>
        <p className="image-caption">
          {ar
            ? 'صور توضيحية للجملة، وليست صور منتجات الكتالوج.'
            : 'Illustrative wholesale imagery, not catalog product photography.'}
        </p>
      </section>
      <section
        className="business-inquiry"
        id="make-request"
        aria-labelledby="business-inquiry-title"
      >
        <div className="business-inquiry__intro">
          <h2 id="business-inquiry-title">{ar ? 'لنبدأ الحديث' : "Let's make it happen"}</h2>
          <p>
            {ar
              ? 'اختر خدمة وشارك التفاصيل، ثم ناقش طلبك مع فريقنا.'
              : 'Choose a service, share the details, then discuss your request with our team.'}
          </p>
        </div>
        {requestForm && <div className="business-inquiry__form">{requestForm}</div>}
      </section>
      <section
        className="business-steps"
        aria-label={ar ? 'كيف يعمل الطلب' : 'How the inquiry works'}
      >
        {steps[language].map(([number, title, description]) => (
          <article className="business-step" key={number}>
            <div className="business-step__label">
              <span>{number}</span>
              <h3>{title}</h3>
            </div>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </>
  )
}

export default function Home() {
  return <BusinessHome requestForm={<RequestStart embedded />} />
}
