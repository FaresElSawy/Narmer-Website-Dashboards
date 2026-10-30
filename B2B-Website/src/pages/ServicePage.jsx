import { Link, useParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime } from '../../../shared/ui/Runtime.jsx'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { useBusinessContent } from '../features/content/BusinessContentProvider.jsx'
import { ResponsiveImage, serviceImage } from '../features/content/ServiceImage.jsx'
import { serviceLinks } from '../app/config.js'
import { serviceContent } from '../content/services.js'
import '../assets/css/business-content.css'

export function ServicePage({ type: givenType }) {
  const params = useParams(),
    type = givenType || params.type,
    language = useLocale(),
    ar = language === 'ar'
  const { config } = useRuntime(),
    { home } = useBusinessContent(),
    supported = serviceContent[type]
  if (!supported)
    return (
      <section className="business-content-page">
        <h1>{ar ? 'الخدمة غير متاحة' : 'Service unavailable'}</h1>
        <Button to={`/${language}`}>{ar ? 'العودة للرئيسية' : 'Back to home'}</Button>
      </section>
    )
  const copy = supported[language],
    image = serviceImage(type, home, language)
  const otherServices = serviceLinks(language).filter(
    (item) => item.key !== type && item.key !== 'wholesale',
  )
  const familyCopy = ar
    ? {
        spinning: ['متطلبات الخيوط', 'مناقشة الحجم والموعد'],
        weaving: ['متطلبات إنتاج النسيج', 'إرسال المواصفات'],
        fabric: ['الأقمشة وإنتاج الملابس', 'مناقشة متطلبات المشروع'],
        'school-uniforms': ['المدارس والحضانات', 'مناقشة الكميات والمقاسات'],
      }
    : {
        spinning: ['Yarn requirements', 'Discuss volume and deadline'],
        weaving: ['Fabric production needs', 'Share specifications'],
        fabric: ['Fabric and clothing production', 'Discuss project requirements'],
        'school-uniforms': ['Schools and nurseries', 'Discuss quantities and sizes'],
      }
  return (
    <>
      <Metadata
        config={config}
        title={`${copy.title} | ${ar ? 'نارمر للأعمال' : 'Narmer for Business'}`}
        description={copy.summary}
        path={`/services/${type}`}
        structuredData={
          config.siteOrigin
            ? {
                '@context': 'https://schema.org',
                '@type': 'Service',
                name: copy.title,
                description: copy.summary,
                url: `${config.siteOrigin}/${language}/services/${type}`,
                provider: { '@type': 'Organization', name: 'Narmer' },
              }
            : undefined
        }
        publicPage
      />
      <article className="business-service-page" aria-labelledby="business-service-title">
        <header className="business-service-heading">
          <h1 id="business-service-title">{copy.title}</h1>
          <p>{copy.summary}</p>
        </header>
        <figure className="business-service-illustration">
          <ResponsiveImage
            slot={image.slot}
            fallback={image.fallback}
            alt={image.alt}
            width={image.width}
            height={image.height}
          />
        </figure>
        <div className="business-service-columns">
          <div className="business-service-copy">
            <h2>{ar ? 'تصنيع حسب احتياجاتك' : 'Built around your requirements'}</h2>
            <p>{copy.detail}</p>
            <p>
              {type === 'fabric'
                ? ar
                  ? 'يمكن مناقشة استخدام قماشك أو توفير القماش للمشروع، مع مراجع التصميم وتطوير العينة والإنتاج بالجملة في نفس الاستفسار.'
                  : 'Your own fabric or fabric sourced for the project. Design references, sample development, and bulk clothing production can be discussed in the same request.'
                : ar
                  ? 'شاركنا ما تعرفه عن احتياجات مشروعك، بما في ذلك المواد إذا كانت ذات صلة، وسنراجع التفاصيل معك.'
                  : 'Share what you know about your project needs, including materials if relevant, and we can review the details together.'}
            </p>
          </div>
          <aside className="business-service-cta">
            <h2>{ar ? 'لنناقش مشروعك' : 'Let’s discuss your project'}</h2>
            <p>
              {ar
                ? 'أرسل التفاصيل والمراجع. يؤكد الفريق السعر وإمكانية التنفيذ بالتواصل المباشر وليس عبر الموقع.'
                : 'Send your details and references. Pricing and feasibility are confirmed by the team, not online.'}
            </p>
            <Button variant="accent" to={`/${language}/request?service=${type}`}>
              {ar ? 'إرسال استفسار' : 'Make a request'}
            </Button>
          </aside>
        </div>
        <section className="business-service-family" aria-labelledby="service-family-title">
          <h2 id="service-family-title">{ar ? 'استكشف خدماتنا' : 'Explore our services'}</h2>
          <table>
            <thead>
              <tr>
                {(ar
                  ? ['الخدمة', 'المجال', 'الخطوة التالية', 'الإجراء']
                  : ['Service', 'Focus', 'Next step', 'Action']
                ).map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {otherServices.map((item) => (
                <tr key={item.key}>
                  <th scope="row">
                    <Link to={`/${language}${item.path}`}>{item.label}</Link>
                  </th>
                  <td>{familyCopy[item.key][0]}</td>
                  <td>{familyCopy[item.key][1]}</td>
                  <td>
                    <Link
                      className="service-family-action"
                      to={`/${language}/request?service=${item.key}`}
                    >
                      {ar ? 'إرسال استفسار' : 'Make a request'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </article>
    </>
  )
}
