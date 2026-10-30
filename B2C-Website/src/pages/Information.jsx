import { useLocale } from '../../../shared/ui/Locale.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { config } from '../app/config.js'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { ShopHeading } from '../features/shop/components.jsx'

export default function Information({ page }) {
  const language = useLocale(),
    ar = language === 'ar',
    { content } = useShop()
  const titles = {
    about: ar ? 'عن نارمر' : 'About Narmer',
    contact: ar ? 'تواصل معنا' : 'Contact',
    privacy: ar ? 'الخصوصية' : 'Privacy',
    terms: ar ? 'الشروط' : 'Terms',
  }
  const title = titles[page]
  return (
    <div className="shop-page shop-information">
      <Metadata
        config={config}
        title={`${title} | Narmer`}
        description={title}
        path={`/${page}`}
        publicPage={
          page === 'about' ||
          (page === 'contact' &&
            Boolean(
              content?.settings?.phones?.length ||
              content?.settings?.emails?.length ||
              content?.settings?.address,
            ))
        }
      />
      <ShopHeading title={title} />
      {page === 'about' ? (
        <p>
          {ar
            ? 'ملابس لكل يوم. من نارمر. نربط التصنيع بتصاميم تناسب يومك.'
            : 'Everyday clothing. Made by Narmer. We bring manufacturing and everyday design together.'}
        </p>
      ) : page === 'contact' ? (
        <div>
          {content?.settings?.phones?.map((phone) => (
            <p key={phone}>
              <a href={`tel:${phone}`}>{phone}</a>
            </p>
          ))}
          {content?.settings?.emails?.map((email) => (
            <p key={email}>
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          ))}
          {content?.settings?.address && <p>{content.settings.address}</p>}
          {!content?.settings?.phones?.length && !content?.settings?.emails?.length && (
            <p>
              {ar ? 'بيانات التواصل لم تُنشر بعد.' : 'Contact details have not been published yet.'}
            </p>
          )}
        </div>
      ) : (
        <p>
          {ar
            ? 'المحتوى النهائي لهذه الصفحة بانتظار النشر.'
            : 'The final content for this page is awaiting publication.'}
        </p>
      )}
    </div>
  )
}
