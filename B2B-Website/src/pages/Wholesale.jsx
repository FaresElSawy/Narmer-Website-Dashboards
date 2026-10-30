import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { ProductGallery } from '../../../shared/ui/ProductGallery.jsx'
import { SizeGuide } from '../../../shared/ui/SizeGuide.jsx'
import { useInquiry } from '../features/inquiry/InquiryProvider.jsx'
import { InquiryError, PageHeading } from '../features/inquiry/components.jsx'
import { offerSlugs } from '../../../shared/lib/offer-slugs.js'
import '../assets/css/inquiry.css'

function ProductImage({ image, alt, lazy = false }) {
  const [failed, setFailed] = useState(null),
    ar = useLocale() === 'ar'
  if (!image?.url || failed === image.url)
    return <span>{ar ? 'الصورة غير متاحة' : 'Image unavailable'}</span>
  return (
    <img
      src={image.url}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      onError={() => setFailed(image.url)}
    />
  )
}

function OfferComposition({ offer }) {
  const ar = useLocale() === 'ar',
    options = offer.product?.options || []
  const headers = options.length
    ? options.map((option) => ({ key: option.key, label: option.name }))
    : [{ key: 'contents', label: ar ? 'المحتويات' : 'Contents' }]
  return (
    <div
      className="offer-composition"
      tabIndex={0}
      role="region"
      aria-label={ar ? 'التكوين الثابت للعبوة' : 'Fixed pouch composition'}
    >
      <table>
        <caption>{ar ? 'التكوين الثابت للعبوة' : 'Fixed pouch composition'}</caption>
        <thead>
          <tr>
            {headers.map((column) => (
              <th scope="col" key={column.key}>
                {column.label}
              </th>
            ))}
            <th scope="col">{ar ? 'القطع' : 'Pieces'}</th>
          </tr>
        </thead>
        <tbody>
          {offer.composition.map((row, index) => {
            const variant = offer.product?.variants.find((item) => item.id === row.variantId)
            return (
              <tr key={row.variantId || index}>
                {headers.map((column) => {
                  const option = options.find((item) => item.key === column.key),
                    value = option
                      ? option.values.find((item) => item.key === variant?.values[option.key])
                          ?.name || '-'
                      : offer.product?.name || offer.name
                  return (
                    <td key={column.key} data-label={column.label}>
                      {value}
                    </td>
                  )
                })}
                <td data-label={ar ? 'القطع' : 'Pieces'}>
                  {row.quantity.toLocaleString(ar ? 'ar' : 'en')}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OfferSizeGuide({ offer, api }) {
  const ar = useLocale() === 'ar',
    [guide, setGuide] = useState(null),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    if (offer.sourceStore !== 'b2c') return
    const controller = new AbortController()
    api
      .sizeChart(offer, controller.signal)
      .then((chart) => {
        if (!controller.signal.aborted) {
          setGuide(chart)
          setFailed(false)
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [api, offer, retry])
  return failed ? (
    <div className="offer-guide-error">
      <p>{ar ? 'دليل المقاسات غير متاح حاليًا.' : 'The size guide is currently unavailable.'}</p>
      <Button
        variant="secondary"
        onClick={() => {
          setFailed(false)
          setRetry((value) => value + 1)
        }}
      >
        {ar ? 'إعادة محاولة تحميل الدليل' : 'Retry size guide'}
      </Button>
    </div>
  ) : (
    <SizeGuide chart={guide} />
  )
}

export default function Wholesale() {
  const { offerId: offerKey } = useParams(),
    [search, setSearch] = useSearchParams(),
    language = useLocale(),
    ar = language === 'ar',
    { api, addOffer, state, publicData } = useInquiry(),
    navigate = useNavigate(),
    location = useLocation()
  const page = Math.max(1, Math.min(100000, Number(search.get('page')) || 1)),
    q = (search.get('q') || '').slice(0, 100),
    key = `${language}:${offerKey || ''}:${page}:${q}`
  const initialOffer =
    offerKey && publicData?.offer?.slug === offerKey
      ? publicData.offer
      : publicData?.offers?.items.find((offer) => offer.slug === offerKey)
  const initial =
    publicData?.language === language
      ? offerKey
        ? initialOffer
        : page === 1 && !q
          ? publicData.offers
          : null
      : null
  const [resource, setResource] = useState({
      key,
      data: initial || null,
      error: null,
    }),
    [quantity, setQuantity] = useState(1),
    [actionError, setActionError] = useState(null)
  useEffect(() => {
    const controller = new AbortController(),
      { signal } = controller
    async function load() {
      try {
        const data = offerKey
          ? await api.resolveOffer(offerKey, signal)
          : await api.offers({ page, limit: 8, q }, signal)
        offerSlugs(offerKey ? [data] : data.items)
        if (!signal.aborted) setResource({ key, data, error: null })
      } catch (error) {
        if (!signal.aborted) setResource({ key, data: null, error })
      }
    }
    load()
    return () => controller.abort()
  }, [api, offerKey, page, q, key])
  const current = resource.key === key ? resource : { data: null, error: null }
  const offer = offerKey ? current.data : null
  const offerPath = (item) => `/wholesale/offers/${item?.slug || offerKey}`
  const canonicalSlug = offer?.slug
  useEffect(() => {
    if (offerKey && canonicalSlug && offerKey !== canonicalSlug)
      navigate(
        {
          pathname: `/${language}/wholesale/offers/${canonicalSlug}`,
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      )
  }, [canonicalSlug, offerKey, language, location.search, location.hash, navigate])
  function add() {
    try {
      if (addOffer(offer, quantity)) navigate(`/${language}/request`)
    } catch (error) {
      setActionError(error)
    }
  }
  return (
    <div className={`inquiry-page wholesale-page${offerKey ? ' wholesale-offer-page' : ''}`}>
      <PageHeading
        title={offer?.name || (ar ? 'مجموعة الجملة' : 'Wholesale collection')}
        description={
          offerKey
            ? offer?.description
            : ar
              ? 'ملابس جاهزة في عبوات بتكوين ثابت. اختر الكميات وناقش احتياجك مع الفريق.'
              : 'Ready-made clothing in fixed pouches. Choose quantities and discuss your requirements with the team.'
        }
        path={offerKey ? offerPath(offer) : '/wholesale'}
        publicPage={offerKey ? Boolean(offer) : !q && page === 1}
        breadcrumbOnly={Boolean(offer)}
      />
      <InquiryError error={actionError || current.error} />
      {!current.data && !current.error && (
        <Feedback
          kind="loading"
          skeleton={offerKey ? 'product' : 'cards'}
          title={ar ? 'جارٍ تحميل العروض' : 'Loading offers'}
        />
      )}
      {current.error && (
        <Button variant="secondary" to={`/${language}/wholesale`}>
          {ar ? 'العودة إلى المجموعة' : 'Back to collection'}
        </Button>
      )}
      {offer && (
        <div className="offer-layout">
          <ProductGallery
            key={offer.id}
            images={offer.product?.images || []}
            name={offer.product?.name || offer.name}
          />
          <div className="offer-details">
            <h1>{offer.name}</h1>
            {offer.description && <p>{offer.description}</p>}
            <h2>
              {offer.piecesPerPouch.toLocaleString(language)}{' '}
              {ar ? 'قطعة في العبوة' : 'pieces per pouch'}
            </h2>
            <OfferComposition offer={offer} />
            <OfferSizeGuide key={`${offer.id}:${language}`} offer={offer} api={api} />
            <div className="field">
              <label htmlFor="offer-quantity">
                {ar ? 'العبوات المطلوبة' : 'Pouches required'} *
              </label>
              <input
                id="offer-quantity"
                type="number"
                min="1"
                max="10000"
                step="1"
                required
                value={quantity}
                aria-invalid={!Number.isInteger(quantity) || quantity < 1 || quantity > 10000}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </div>
            <strong className="pouch-calculation">
              {quantity.toLocaleString(language)}{' '}
              {ar ? 'عبوة' : quantity === 1 ? 'pouch' : 'pouches'} ×{' '}
              {offer.piecesPerPouch.toLocaleString(language)} {ar ? 'قطعة' : 'pieces'} ={' '}
              {(quantity * offer.piecesPerPouch).toLocaleString(language)} {ar ? 'قطعة' : 'pieces'}
            </strong>
            <Button
              variant="accent"
              disabled={
                Boolean(state.pending) ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 10000
              }
              onClick={add}
            >
              {ar ? 'إضافة إلى الطلب' : 'Add to request'}
            </Button>
            <div className="inquiry-note">
              <h3>{ar ? 'يرجى الانتباه' : 'Please note'}</h3>
              <p>
                {ar
                  ? 'لا يمكن تغيير التكوين في هذا العرض. يمكن مناقشة متطلبات مختلفة من خلال طلب تصنيع.'
                  : 'The mix cannot be changed in this offer. A different requirement can be discussed through a manufacturing request.'}
              </p>
            </div>
          </div>
        </div>
      )}
      {!offerKey && (
        <>
          <div className="inquiry-note wholesale-intro">
            <h2>{ar ? 'مصممة للشراء بالجملة' : 'Made for bulk buying'}</h2>
            <p>
              {ar
                ? 'اختر عدد العبوات الكاملة لكل عرض، دون تغيير المقاسات أو الألوان داخلها.'
                : 'Choose how many complete pouches you need for each offer. The sizes and colors inside each pouch stay fixed.'}
            </p>
            {state.selections.length > 0 && (
              <Button to={`/${language}/request`}>
                {ar
                  ? `متابعة الطلب (${state.selections.length})`
                  : `Continue request (${state.selections.length})`}
              </Button>
            )}
          </div>
          <form
            className="wholesale-search"
            onSubmit={(event) => {
              event.preventDefault()
              const value = new FormData(event.currentTarget).get('q').trim()
              setSearch(value ? { q: value, page: '1' } : {})
            }}
          >
            <label htmlFor="offer-search">{ar ? 'البحث في العروض' : 'Search offers'}</label>
            <input id="offer-search" name="q" type="search" maxLength="100" defaultValue={q} />
            <Button type="submit" variant="secondary">
              {ar ? 'بحث' : 'Search'}
            </Button>
          </form>
          {current.data?.items.length === 0 && (
            <Feedback
              title={
                ar ? 'لا توجد عروض متاحة لهذه الخيارات' : 'No offers available for these options'
              }
              action={
                <Button variant="secondary" onClick={() => setSearch({})}>
                  {ar ? 'مسح البحث' : 'Clear search'}
                </Button>
              }
            />
          )}
          <div className="wholesale-grid">
            {current.data?.items.map((item) => (
              <Link className="offer-card" key={item.id} to={`/${language}${offerPath(item)}`}>
                <div className="offer-card-image">
                  <ProductImage
                    image={item.product?.images[0]}
                    alt={item.product?.name || item.name}
                    lazy
                  />
                </div>
                <h2>{item.name}</h2>
                <p>
                  {item.piecesPerPouch.toLocaleString(language)}{' '}
                  {ar ? 'قطعة / عبوة ثابتة' : 'pieces / fixed pouch'}
                </p>
                <span>{ar ? 'عرض التفاصيل' : 'View offer'}</span>
              </Link>
            ))}
          </div>
          {current.data && (
            <nav className="inquiry-pagination" aria-label={ar ? 'صفحات العروض' : 'Offer pages'}>
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setSearch({ ...(q ? { q } : {}), page: String(page - 1) })}
              >
                {ar ? 'السابق' : 'Previous'}
              </Button>
              <span>
                {page} / {Math.max(1, current.data.pagination.pages)}
              </span>
              <Button
                variant="secondary"
                disabled={page >= current.data.pagination.pages}
                onClick={() => setSearch({ ...(q ? { q } : {}), page: String(page + 1) })}
              >
                {ar ? 'التالي' : 'Next'}
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
