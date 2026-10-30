import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { Button, Feedback, Modal } from '../../../../shared/ui/Primitives.jsx'
import { useRuntime, useSession } from '../../../../shared/ui/Runtime.jsx'
import { formatMoney } from '../../../../shared/lib/money.js'
import { errorMessage } from '../../../../shared/lib/messages.js'
import { productPath, selectedVariant, optionVariant } from './catalog.js'
import { ProductOptions } from './ProductOptions.jsx'
import { usePurchase } from './usePurchase.js'
import { useShop } from './ShopProvider.jsx'
import { useShopRead } from './useShopRead.js'
import { Icon } from '../../../../shared/ui/Brand.jsx'

export function ShopHeading({ title, children }) {
  const language = useLocale()
  return (
    <header className="shop-heading">
      <p className="shop-breadcrumb">
        <Link to={`/${language}`}>{language === 'ar' ? 'الرئيسية' : 'Home'}</Link> /{' '}
        {language === 'ar' ? 'متجر نارمر' : 'Narmer Store'}
      </p>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  )
}
export function ShopError({ error, retry }) {
  const language = useLocale(),
    ar = language === 'ar'
  const [seconds, setSeconds] = useState(error.retryAfter || 0)
  useEffect(() => {
    const deadline = Date.now() + (error.retryAfter || 0) * 1000
    const timer = setInterval(
      () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      1000,
    )
    return () => clearInterval(timer)
  }, [error])
  return (
    <Feedback
      kind="error"
      title={
        error.message === 'CATEGORY_UNAVAILABLE'
          ? ar
            ? 'هذه المجموعة غير متاحة حاليًا.'
            : 'This collection is currently unavailable.'
          : errorMessage(error, language)
      }
      action={
        retry && (
          <Button
            variant="secondary"
            onClick={retry}
            disabled={error.status === 429 && seconds > 0}
          >
            {ar ? 'حاول مرة أخرى' : 'Try again'}
          </Button>
        )
      }
    >
      {error.status === 429 && error.retryAfter
        ? ar
          ? `انتظر ${error.retryAfter} ثانية قبل المحاولة.`
          : `Wait ${error.retryAfter} seconds before trying again.`
        : error.requestId
          ? `${ar ? 'مرجع الدعم' : 'Support reference'}: ${error.requestId}`
          : null}
    </Feedback>
  )
}
export function CatalogImage({ image, alt = '', eager = false }) {
  const [failed, setFailed] = useState(null),
    ar = useLocale() === 'ar'
  return !image?.url || failed === image.url ? (
    <span className="catalog-image-placeholder">
      {ar ? 'الصورة غير متاحة' : 'Image unavailable'}
    </span>
  ) : (
    <img
      src={image.url}
      alt={alt}
      width={image.width}
      height={image.height}
      loading={eager ? undefined : 'lazy'}
      onError={() => setFailed(image.url)}
    />
  )
}
export function ProductCard({ product }) {
  const language = useLocale(),
    ar = language === 'ar'
  const [quick, setQuick] = useState(null),
    { user } = useSession(),
    { restoring } = useRuntime()
  return (
    <article className="product-card">
      <Link
        to={`/${language}${productPath(product)}`}
        state={{ productId: product.id }}
        className="product-card-image"
        tabIndex={-1}
        aria-hidden="true"
      >
        <CatalogImage image={product.images[0] || product.variants?.[0]?.images?.[0]} />
      </Link>
      <div className="product-card-copy">
        <h3>
          <Link to={`/${language}${productPath(product)}`} state={{ productId: product.id }}>
            {product.name}
          </Link>
        </h3>
        <p className="product-card-price">
          <bdi>
            {formatMoney(
              product.matchingPrice ?? product.effectivePrice ?? product.priceFrom,
              language,
            )}
          </bdi>
        </p>
        <Button
          variant="text"
          className="product-card-action"
          to={`/${language}${productPath(product)}`}
          state={{ productId: product.id }}
        >
          {ar ? 'عرض المنتج' : 'View product'}
          <Icon name="arrow" />
        </Button>
        <div className="product-card-quick-actions">
          <Button
            variant="secondary"
            onClick={() => setQuick('add')}
            disabled={restoring || (user && user.role !== 'user')}
            aria-label={`${ar ? 'إضافة إلى السلة' : 'Add to cart'} - ${product.name}`}
          >
            <Icon name="cart" />
            {ar ? 'أضف للسلة' : 'Add to cart'}
          </Button>
          <Button
            variant="accent"
            className="quick-buy-icon"
            onClick={() => setQuick('buy')}
            disabled={restoring || (user && user.role !== 'user')}
            aria-label={`${ar ? 'اشترِ الآن' : 'Buy now'} - ${product.name}`}
            title={ar ? 'اشترِ الآن' : 'Buy now'}
          >
            <Icon name="buy" />
          </Button>
        </div>
      </div>
      {quick && (
        <QuickShop
          productId={product.id}
          name={product.name}
          intent={quick}
          onClose={() => setQuick(null)}
        />
      )}
    </article>
  )
}
function QuickShop({ productId, name, intent, onClose }) {
  const { api } = useShop(),
    language = useLocale()
  const read = useShopRead(
    (signal) => api.product(productId, { language, signal }),
    `${productId}:${language}`,
  )
  return (
    <Modal open onClose={onClose} title={name} className="quick-shop">
      {read.error ? (
        <ShopError error={read.error} retry={read.reload} />
      ) : read.data ? (
        <QuickSelection product={read.data} intent={intent} onClose={onClose} />
      ) : (
        <Feedback
          kind="loading"
          skeleton="product"
          title={language === 'ar' ? 'تحميل الاختيارات' : 'Loading options'}
        />
      )}
    </Modal>
  )
}
function QuickSelection({ product, intent, onClose }) {
  const language = useLocale(),
    ar = language === 'ar'
  const first = product.variants?.find((variant) => variant.stock > 0) || product.variants?.[0]
  const [values, setValues] = useState(() =>
      first?.values.color ? { color: first.values.color } : {},
    ),
    [quantity, setQuantity] = useState(1)
  const chosen = selectedVariant(product, values),
    preview =
      chosen ||
      (values.color ? optionVariant(product, values, 'color', values.color) : first) ||
      product
  const purchase = usePurchase(product, chosen, quantity)
  return (
    <div className="quick-shop-content">
      <div className="quick-shop-product">
        <CatalogImage image={preview.images?.[0] || product.images?.[0]} alt={product.name} eager />
        <div>
          <p className="account-eyebrow">{ar ? 'تسوق سريع' : 'QUICK SHOP'}</p>
          <strong>{formatMoney(preview.effectivePrice ?? product.priceFrom, language)}</strong>
          <p>{ar ? 'اختر اللون والمقاس المناسبين.' : 'Choose your color and size.'}</p>
        </div>
      </div>
      <ProductOptions
        product={product}
        values={values}
        disabled={purchase.busy}
        onChange={(next, key) => {
          setValues((current) => ({ ...current, [key]: next[key] }))
          setQuantity(1)
        }}
      />
      <Quantity
        value={quantity}
        onChange={setQuantity}
        max={Math.min(10000, chosen?.stock || 10000)}
        disabled={purchase.busy}
      />
      {!chosen && (
        <p className="purchase-help">
          {ar ? 'اختر الخيارات المتاحة للمتابعة.' : 'Choose the available options to continue.'}
        </p>
      )}
      {chosen?.stock === 0 && <p>{ar ? 'نفدت الكمية' : 'Out of stock'}</p>}
      <div className="purchase-buttons">
        <Button
          variant={intent === 'add' ? 'accent' : 'secondary'}
          disabled={purchase.disabled}
          onClick={async () => {
            if (await purchase.purchase()) onClose()
          }}
        >
          {ar ? 'إضافة إلى السلة' : 'Add to cart'}
        </Button>
        <Button
          variant={intent === 'buy' ? 'accent' : 'primary'}
          disabled={purchase.disabled}
          onClick={() => purchase.purchase(true)}
        >
          {ar ? 'اشترِ الآن' : 'Buy now'}
        </Button>
      </div>
      <p className="purchase-help">
        {ar
          ? 'اشترِ الآن يشمل المنتجات الموجودة في سلتك أيضًا.'
          : 'Buy now also includes the items already in your cart.'}
      </p>
      {purchase.error && <ShopError error={purchase.error} />}
    </div>
  )
}
export function ProductGrid({ items }) {
  return (
    <div className="product-grid">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
export function Quantity({ value, onChange, onCommit, error, disabled, max = 10000, label }) {
  const ar = useLocale() === 'ar',
    id = useId()
  function step(change) {
    const next = Math.max(1, Math.min(max, Number(value) + change))
    onChange(next)
    onCommit?.(next)
  }
  return (
    <div className="shop-quantity">
      <label htmlFor={id}>{label || (ar ? 'الكمية' : 'Quantity')}</label>
      <span
        className="quantity-control"
        onBlur={(event) => {
          if (!disabled && !event.currentTarget.contains(event.relatedTarget)) onCommit?.(value)
        }}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={disabled || Number(value) <= 1}
          aria-label={ar ? 'تقليل الكمية' : 'Decrease quantity'}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          min="1"
          max={max}
          step="1"
          required
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value === '' ? '' : Number(event.target.value))
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && onCommit) {
              event.preventDefault()
              onCommit(value)
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-label={label || (ar ? 'الكمية' : 'Quantity')}
        />
        <button
          type="button"
          onClick={() => step(1)}
          disabled={disabled || Number(value) >= max}
          aria-label={ar ? 'زيادة الكمية' : 'Increase quantity'}
        >
          +
        </button>
      </span>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
