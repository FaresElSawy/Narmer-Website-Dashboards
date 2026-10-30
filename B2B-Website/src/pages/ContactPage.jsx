import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime } from '../../../shared/ui/Runtime.jsx'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { useBusinessContent } from '../features/content/BusinessContentProvider.jsx'
import { ResponsiveImage } from '../features/content/ServiceImage.jsx'
import fabric from '../../../shared/assets/images/fabric.webp'
import '../assets/css/business-content.css'

export function ContactPage() {
  const language = useLocale(),
    ar = language === 'ar',
    { config } = useRuntime(),
    { settings } = useBusinessContent()
  const links = settings
    ? [
        settings.phone && {
          label: ar ? 'الهاتف' : 'Phone',
          href: `tel:${settings.phone}`,
          text: settings.phone,
        },
        settings.email && {
          label: ar ? 'البريد الإلكتروني' : 'Email',
          href: `mailto:${settings.email}`,
          text: settings.email,
        },
        settings.address && { label: ar ? 'العنوان' : 'Address', text: settings.address },
        settings.mapUrl && {
          label: ar ? 'الموقع' : 'Map',
          href: settings.mapUrl,
          text: ar ? 'عرض الخريطة' : 'View map',
        },
        ...Object.entries(settings.social || {})
          .filter(([, href]) => href)
          .map(([key, href]) => ({
            label: key.replace('Url', ''),
            href,
            text: key.replace('Url', ''),
          })),
      ].filter(Boolean)
    : []
  return (
    <>
      <Metadata
        config={config}
        title={ar ? 'تواصل معنا | نارمر للأعمال' : 'Contact | Narmer for Business'}
        description={
          ar
            ? 'تواصل مع نارمر لمناقشة احتياجات مشروعك.'
            : 'Contact Narmer to discuss your business requirements.'
        }
        path="/contact"
        publicPage={links.length > 0}
      />
      <section
        className="business-content-page business-contact"
        aria-labelledby="business-contact-title"
      >
        <p className="eyebrow">{ar ? 'نحن هنا لمساعدتك' : 'LET’S TALK'}</p>
        <h1 id="business-contact-title">{ar ? 'تواصل مع نارمر' : 'Contact Narmer'}</h1>
        <p className="business-lead">
          {ar
            ? 'شاركنا استفسارك عن خدمات نارمر للأعمال.'
            : 'Get in touch with an inquiry about Narmer’s business services.'}
        </p>
        <figure className="business-contact__illustration">
          <ResponsiveImage
            fallback={fabric}
            alt={ar ? 'رسم توضيحي للأقمشة' : 'Illustration of fabric'}
            width="960"
            height="640"
          />
        </figure>
        <div className="business-contact__panels">
          <article className="business-contact-panel">
            <p className="eyebrow">{ar ? 'متابعة طلبك' : 'REQUEST STATUS'}</p>
            <h2>{ar ? 'تحتاج إلى متابعة طلب؟' : 'Need help with a request?'}</h2>
            <p>
              {ar
                ? 'إذا كنت قد أرسلت طلبًا بالفعل، أضف بياناته في استفسارك حتى يتمكن الفريق من مساعدتك.'
                : 'If you have already sent a request, include its details in your inquiry so the team can help.'}
            </p>
            <Button variant="secondary" to={`/${language}/track`}>
              {ar ? 'تابع طلبك' : 'Track a request'}
            </Button>
          </article>
          <article className="business-contact-panel">
            <p className="eyebrow">{ar ? 'استفسارات الأعمال' : 'BUSINESS INQUIRIES'}</p>
            <h2>{ar ? 'أخبرنا عن احتياج مشروعك' : 'Tell us what your business needs'}</h2>
            <p>
              {ar
                ? 'أرسل استفسارك عبر نموذج طلب الأعمال.'
                : 'Send your inquiry through the business request form.'}
            </p>
            <Button variant="primary" to={`/${language}/request`}>
              {ar ? 'افتح نموذج الطلب' : 'Open the request form'}
            </Button>
          </article>
        </div>
        <div className="business-contact__details">
          {links.map(({ label, href, text }) => (
            <div className="business-contact__detail" key={label}>
              <strong>{label}</strong>
              {href ? (
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {text}
                </a>
              ) : (
                <p>{text}</p>
              )}
            </div>
          ))}
          {!links.length && (
            <p className="muted">
              {ar
                ? 'بيانات التواصل العامة ستظهر هنا عند توفرها.'
                : 'Public contact details will appear here when available.'}
            </p>
          )}
        </div>
      </section>
    </>
  )
}
