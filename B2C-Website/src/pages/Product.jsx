import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useNotifications } from '../../../shared/ui/Notifications.jsx'
import { useRuntime, useSession } from '../../../shared/ui/Runtime.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { ProductOptions } from '../features/shop/ProductOptions.jsx'
import { usePurchase } from '../features/shop/usePurchase.js'
import { SizeGuide } from '../../../shared/ui/SizeGuide.jsx'
import { formatMoney } from '../../../shared/lib/money.js'
import { config } from '../app/config.js'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { selectedVariant, productPath, productBySlug } from '../features/shop/catalog.js'
import { ShopHeading, ShopError, ProductGrid, Quantity } from '../features/shop/components.jsx'
import { ProductGallery } from '../../../shared/ui/ProductGallery.jsx'

export default function Product() {
  const { productId, slug } = useParams(),
    language = useLocale(),
    ar = language === 'ar'
  const { api, publicData } = useShop(),
    auth = useSession(),
    { restoring } = useRuntime(),
    navigate = useNavigate(),
    location = useLocation(),
    { notify } = useNotifications()
  const state = useShopRead(
    (signal) =>
      productId
        ? api.product(productId, { language, signal })
        : productBySlug(api, slug, {
            language,
            signal,
            hint:
              location.state?.productId ||
              (publicData?.product?.slug === slug ? publicData.product.id : null),
          }),
    `${language}:${productId || slug}`,
    publicData?.language === language &&
      (publicData?.product?.id === productId || publicData?.product?.slug === slug)
      ? publicData.product
      : null,
  )
  const related = useShopRead(
    (signal) => api.products(new URLSearchParams({ limit: '4' }), { language, signal }),
    `${language}:${productId}`,
    publicData?.related || null,
  )
  const [selection, setSelection] = useState({}),
    [quantity, setQuantity] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  const product = state.data,
    values =
      selection.id === product?.id
        ? selection.values
        : (product?.variants?.find((variant) => variant.stock > 0) || product?.variants?.[0])
            ?.values || {},
    chosen = product && selectedVariant(product, values)
  const staff = auth.user && auth.user.role !== 'user'
  const purchase = usePurchase(product, chosen, quantity)
  async function action() {
    if (busy || restoring) return
    if (!auth.user) {
      navigate(`/${language}/account/login`, { state: { returnTo: location.pathname } })
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.save(product.id, false, { language })
      notify(ar ? 'تم الحفظ في المفضلة.' : 'Saved to your wishlist.')
    } catch (reason) {
      setError(reason)
    } finally {
      setBusy(false)
    }
  }
  if (!product)
    return (
      <div className="shop-page">
        <Metadata config={config} title={`${ar ? 'المنتج' : 'Product'} | Narmer`} description="" />
        <ShopHeading title={ar ? 'المنتج' : 'Product'} />
        {state.error ? (
          <ShopError error={state.error} retry={state.reload} />
        ) : (
          <Feedback
            kind="loading"
            skeleton="product"
            title={ar ? 'جارٍ تحميل المنتج' : 'Loading product'}
          />
        )}
      </div>
    )
  if (productId)
    return (
      <Navigate
        to={`/${language}${productPath(product)}`}
        state={{ productId: product.id }}
        replace
      />
    )
  const images = chosen?.images?.length ? chosen.images : product.images
  const price = chosen?.effectivePrice ?? product.priceFrom
  return (
    <div className="shop-page">
      <Metadata
        config={config}
        title={`${product.name} | Narmer`}
        description={product.description}
        path={productPath(product)}
        publicPage
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: images.map((i) => i.url),
          ...(chosen
            ? {
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'EGP',
                  price: chosen.effectivePrice / 100,
                  availability: `https://schema.org/${chosen.stock > 0 ? 'InStock' : 'OutOfStock'}`,
                },
              }
            : {}),
        }}
      />
      <p className="shop-breadcrumb">
        <a href={`/${language}/products`}>{ar ? 'المتجر' : 'Shop'}</a> / {product.name}
      </p>
      <div className="product-detail">
        <ProductGallery
          key={`${product.id}:${chosen?.id || 'unselected'}`}
          images={images}
          name={product.name}
        />
        <section className="product-selection">
          <h1>{product.name}</h1>
          <p>{ar ? 'مجموعة نارمر اليومية' : 'Narmer everyday collection'}</p>
          <p className="detail-price">
            <bdi>{formatMoney(price, language)}</bdi>
            {chosen?.discountedPrice != null && chosen.discountedPrice < chosen.price && (
              <del>
                <bdi>{formatMoney(chosen.price, language)}</bdi>
              </del>
            )}
          </p>
          <p>{product.description}</p>
          <ProductOptions
            product={product}
            values={values}
            disabled={purchase.busy}
            onChange={(next) => {
              setSelection({ id: product.id, values: next })
              setQuantity(1)
              setError(null)
            }}
          />
          {!chosen && product.type === 'variant' && (
            <p role="status">
              {product.options.every((option) => values[option.key])
                ? ar
                  ? 'هذه التركيبة غير متاحة. غيّر أحد الاختيارات.'
                  : 'This combination is unavailable. Change one of your choices.'
                : ar
                  ? 'اختر اللون والمقاس لعرض السعر والتوفر.'
                  : 'Choose your options to see price and availability.'}
            </p>
          )}
          <SizeGuide chart={product.sizeChart} />
          <Quantity
            value={quantity}
            onChange={setQuantity}
            max={Math.min(10000, chosen?.stock || 10000)}
            disabled={busy || purchase.busy}
          />
          {chosen?.stock === 0 && <p role="status">{ar ? 'نفدت الكمية' : 'Out of stock'}</p>}
          <div className="purchase-buttons">
            <Button
              variant="accent"
              onClick={() => purchase.purchase()}
              disabled={busy || purchase.disabled}
            >
              {purchase.busy
                ? ar
                  ? 'جارٍ الإضافة'
                  : 'Adding'
                : ar
                  ? 'إضافة إلى السلة'
                  : 'Add to cart'}
            </Button>
            <Button
              variant="primary"
              onClick={() => purchase.purchase(true)}
              disabled={busy || purchase.disabled}
            >
              {ar ? 'اشترِ الآن' : 'Buy now'}
            </Button>
          </div>
          <p className="purchase-help">
            {ar
              ? 'اشترِ الآن ينتقل للدفع مع هذا المنتج وأي منتجات أخرى في سلتك.'
              : 'Buy now checks out this item together with anything already in your cart.'}
          </p>
          {purchase.error && <ShopError error={purchase.error} />}
          <Button
            variant="secondary"
            onClick={action}
            disabled={busy || purchase.busy || restoring || staff}
          >
            {ar ? 'حفظ في المفضلة' : 'Save to wishlist'}
          </Button>
          {staff && (
            <p>
              {ar
                ? 'التسوق متاح للزوار وحسابات العملاء.'
                : 'Shopping is available to guests and customer accounts.'}
            </p>
          )}
          {error && <ShopError error={error} />}
          <div className="product-details-note">
            <h2>{ar ? 'تفاصيل المنتج' : 'Product details'}</h2>
            <p>
              {ar
                ? 'يحدد اللون والمقاس المختاران الصورة والسعر والتوفر.'
                : 'Selected options control the image, price and availability.'}
            </p>
          </div>
        </section>
      </div>
      {related.data?.items.length > 0 && (
        <section className="shop-related">
          <h2>{ar ? 'قد يعجبك أيضًا' : 'You may also like'}</h2>
          <ProductGrid
            items={related.data.items.filter((item) => item.id !== product.id).slice(0, 4)}
          />
        </section>
      )}
    </div>
  )
}
