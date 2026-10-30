import { useState } from 'react'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime, useSession } from '../../../shared/ui/Runtime.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { config } from '../app/config.js'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { ProductCard, ShopError, ShopHeading } from '../features/shop/components.jsx'
import { useNotifications } from '../../../shared/ui/Notifications.jsx'

export default function Wishlist() {
  const { user } = useSession(),
    language = useLocale(),
    ar = language === 'ar',
    { restoring } = useRuntime()
  return (
    <div className="shop-page">
      <Metadata
        config={config}
        title={`${ar ? 'المفضلة' : 'Your wishlist'} | Narmer`}
        description=""
        path="/wishlist"
      />
      <ShopHeading title={ar ? 'المفضلة' : 'Your wishlist'}>
        {ar
          ? 'منتجاتك المحفوظة. اختر اللون والمقاس في صفحة المنتج.'
          : 'Saved products, ready when you are. Choose size and color on the product page.'}
      </ShopHeading>
      {restoring ? (
        <Feedback
          kind="loading"
          skeleton="cards"
          title={ar ? 'جارٍ تحميل المفضلة' : 'Loading wishlist'}
        />
      ) : user?.role === 'user' && user.store === 'b2c' ? (
        <SavedProducts key={`${user.id}:${language}`} />
      ) : (
        <Feedback
          title={
            ar
              ? 'سجّل الدخول بحساب عميل لحفظ منتجاتك.'
              : 'Sign in with a customer account to save your products.'
          }
          action={
            <Button
              variant="accent"
              to={`/${language}/account/login`}
              state={{ returnTo: `/${language}/wishlist` }}
            >
              {ar ? 'تسجيل الدخول' : 'Sign in'}
            </Button>
          }
        />
      )}
    </div>
  )
}
function SavedProducts() {
  const language = useLocale(),
    ar = language === 'ar',
    { api } = useShop(),
    { notify } = useNotifications()
  const state = useShopRead((signal) => api.wishlist({ language, signal }), language)
  const [busy, setBusy] = useState(null),
    [error, setError] = useState(null)
  async function remove(id) {
    if (busy) return
    setBusy(id)
    setError(null)
    try {
      state.replace(await api.save(id, true, { language }))
      notify(ar ? 'تمت إزالة المنتج من المفضلة.' : 'The product was removed from your wishlist.')
    } catch (reason) {
      setError(reason)
    } finally {
      setBusy(null)
    }
  }
  if (state.error) return <ShopError error={state.error} retry={state.reload} />
  if (!state.data)
    return (
      <Feedback
        kind="loading"
        skeleton="cards"
        title={ar ? 'جارٍ تحميل المفضلة' : 'Loading wishlist'}
      />
    )
  return (
    <>
      {error && <ShopError error={error} />}
      <div className="product-grid">
        {state.data.items.map((item) => (
          <div className="saved-product" key={item.productId}>
            {item.product ? (
              <ProductCard product={item.product} />
            ) : (
              <Feedback title={ar ? 'المنتج لم يعد متاحًا' : 'Product no longer available'} />
            )}
            <Button
              variant="secondary"
              onClick={() => remove(item.productId)}
              disabled={Boolean(busy)}
            >
              {ar ? 'إزالة من المفضلة' : 'Remove from wishlist'}
            </Button>
          </div>
        ))}
      </div>
      {state.data.itemCount === 0 && (
        <Feedback title={ar ? 'لم تحفظ أي منتجات بعد.' : 'You have no saved products yet.'} />
      )}
      <p className="shop-note">
        {ar
          ? 'إضافة منتج إلى السلة لا تزيله من المفضلة.'
          : 'Adding a product to the cart does not remove it from saved products.'}
      </p>
      <Button variant="secondary" to={`/${language}/products`}>
        {ar ? 'متابعة التسوق' : 'Continue shopping'}
      </Button>
    </>
  )
}
