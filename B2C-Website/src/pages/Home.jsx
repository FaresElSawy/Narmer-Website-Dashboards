import { useState } from 'react'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { Icon } from '../../../shared/ui/Brand.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { homeCopy } from '../content/home.js'
import { config } from '../app/config.js'
import men from '../../../shared/assets/images/campaign-men.webp'
import women from '../assets/images/brown.webp'
import fabric from '../../../shared/assets/images/fabric.webp'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { retailImages } from '../features/shop/images.js'
import { ProductGrid, ShopError } from '../features/shop/components.jsx'

function HomeImage({ slot, fallback, alt, className = '', eager = false }) {
  const [failed, setFailed] = useState(0)
  if (failed === 2) return <span className={`catalog-image-placeholder ${className}`}>{alt}</span>
  return (
    <picture className={className}>
      <source
        media="(max-width: 639px)"
        srcSet={(!failed && (slot?.mobileImage?.url || slot?.desktopImage?.url)) || fallback}
      />
      <img
        src={(!failed && slot?.desktopImage?.url) || fallback}
        alt={slot?.alt || alt}
        width={slot?.desktopImage?.width || 1200}
        height={slot?.desktopImage?.height || 1200}
        loading={eager ? undefined : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        onError={() => setFailed(!failed && (slot?.mobileImage || slot?.desktopImage) ? 1 : 2)}
      />
    </picture>
  )
}

export default function Home() {
  const language = useLocale(),
    copy = homeCopy[language],
    ar = language === 'ar',
    { content, contentError, reloadContent } = useShop()
  const home = content?.homepage,
    slot = (key) => home?.slots?.find((item) => item.key === key)
  const collectionPath = (key) => {
    const category = content?.categories.find((item) => item.slug === key)
    return `/${language}/products?${category ? `categoryId=${category.id}` : `collection=${key}`}`
  }
  return (
    <>
      <Metadata
        config={config}
        title={content?.settings?.seo?.title || copy.metaTitle}
        description={content?.settings?.seo?.description || copy.metaDescription}
        keywords={content?.settings?.seo?.keywords || undefined}
        publicPage
      />
      <section className="public-hero" aria-labelledby="home-title">
        <div className="campaign">
          <HomeImage
            className="campaign-photo"
            slot={slot('hero-left')}
            fallback={men}
            alt={ar ? 'هودي أبيض برسمة من نارمر' : 'Narmer white graphic hoodie'}
            eager
          />
          <div className="campaign-copy">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 id="home-title">{copy.title}</h1>
            <p>{copy.description}</p>
            <div className="campaign-actions">
              <Button variant="accent" to={collectionPath('men')}>
                {copy.men}
              </Button>
              <Button variant="accent" to={collectionPath('women')}>
                {copy.women}
              </Button>
            </div>
          </div>
          <HomeImage
            className="campaign-photo"
            slot={slot('hero-right')}
            fallback={women}
            alt={
              ar ? 'سويت شيرت بني بنصف سحاب من نارمر' : 'Narmer brown Sporty quarter-zip sweatshirt'
            }
            eager
          />
        </div>
      </section>
      {contentError && (
        <div className="retail-inner">
          <ShopError error={contentError} retry={reloadContent} />
        </div>
      )}
      {home?.newArrivals.items.length > 0 && (
        <section className="retail-curated retail-section">
          <div className="retail-inner">
            <div className="retail-section-heading">
              <h2>{ar ? 'وصل حديثًا' : 'New Arrivals'}</h2>
              <Button variant="text" to={`/${language}/products?sort=newest`}>
                {ar ? 'تسوق المجموعة' : 'Shop the collection'}
                <Icon name="arrow" />
              </Button>
            </div>
            <ProductGrid items={home.newArrivals.items} />
          </div>
        </section>
      )}
      <section className="retail-section">
        <div className="retail-inner">
          <h2>{ar ? 'اكتشف ما يناسب يومك.' : 'Find your everyday.'}</h2>
          <div className="retail-collections">
            {[
              ['men', retailImages.logo.url, ar ? 'قسم الرجال' : 'Men’s Section', copy.men],
              ['women', retailImages.brown.url, ar ? 'قسم النساء' : 'Women’s Section', copy.women],
            ].map(([key, fallback, title, label]) => (
              <article key={key}>
                <HomeImage slot={slot(`collection-${key}`)} fallback={fallback} alt={title} />
                <div>
                  <h3>{title}</h3>
                  <Button variant="secondary" to={collectionPath(key)}>
                    {label}
                    <Icon name="arrow" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="retail-section retail-sale">
        <div className="retail-inner">
          <div className="retail-sale-feature">
            <HomeImage
              slot={slot('sale-feature')}
              fallback={retailImages.pink.url}
              alt={ar ? 'هودي نارمر وردي' : 'Narmer pink hoodie'}
            />
            <div>
              <p className="eyebrow">{ar ? 'اختيارات مميزة' : 'THE SALE EDIT'}</p>
              <h2>{ar ? 'تصاميم مختارة. فرص جديدة.' : 'Selected styles. Fresh possibilities.'}</h2>
              <p>
                {ar
                  ? 'اكتشف القطع المتاحة في مجموعة التخفيضات.'
                  : 'Explore the pieces in our current sale selection.'}
              </p>
              <Button variant="accent" to={`/${language}/products?saleOnly=true`}>
                {ar ? 'اكتشف التخفيضات' : 'Explore Sale'}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="retail-section">
        <div className="retail-inner">
          <div className="retail-story">
            <HomeImage slot={slot('factory-story')} fallback={fabric} alt="" />
            <div>
              <p className="eyebrow">{ar ? 'قصة نارمر' : 'THE NARMER STORY'}</p>
              <h2>
                {ar ? 'من مصنعنا. إلى كل يوم في حياتك.' : 'From our factory. Into your everyday.'}
              </h2>
              <p>
                {ar
                  ? 'ملابس يومية من الأشخاص الذين يصنعونها.'
                  : 'Everyday clothing from the people who make it.'}
              </p>
              <Button variant="accent" to={`/${language}/about`}>
                {ar ? 'اكتشف نارمر' : 'Discover Narmer'}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
