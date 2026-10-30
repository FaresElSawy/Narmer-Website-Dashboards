import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { Brand } from './Brand.jsx'
import { PublicHeader } from './PublicHeader.jsx'
import { SiteLoader } from './SiteLoader.jsx'
import { LanguageLink, useLocale } from './Locale.jsx'
import {
  animateAccountTabContent,
  isAccountTabPath,
  startPageMotion,
} from '../assets/js/page-motion.js'

export function PublicShell({ store, config, navigation, cartCount, children }) {
  const language = useLocale(),
    ar = language === 'ar',
    base = `/${language}`
  const { pathname } = useLocation()
  const main = useRef(null)
  const previousPath = useRef(pathname)
  useEffect(() => startPageMotion(main.current), [pathname])
  useLayoutEffect(() => {
    const tabSwitch =
      previousPath.current !== pathname &&
      isAccountTabPath(previousPath.current) &&
      isAccountTabPath(pathname)
    previousPath.current = pathname
    if (tabSwitch) return animateAccountTabContent(main.current)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])
  const retail = store === 'b2c'
  const labels = ar
    ? {
        menu: 'القائمة',
        account: 'الحساب',
        wishlist: 'المفضلة',
        cart: 'السلة',
        request: 'قدّم طلبك',
        home: 'الرئيسية',
        shop: 'تسوق',
        help: 'المساعدة',
        info: 'معلومات',
        track: 'تتبع طلبك',
        contact: 'تواصل معنا',
        about: 'عن نارمر',
        privacy: 'الخصوصية',
        terms: 'الشروط',
        close: 'إغلاق',
      }
    : {
        menu: 'Menu',
        account: 'Account',
        wishlist: 'Wishlist',
        cart: 'Cart',
        request: 'Make a request',
        home: 'Home',
        shop: 'Shop',
        help: 'Help',
        info: 'Information',
        track: 'Track your order',
        contact: 'Contact',
        about: 'About Narmer',
        privacy: 'Privacy',
        terms: 'Terms',
        close: 'Close',
      }
  const link = (item) => (
    <Link key={item.key} to={`${base}${item.path}`}>
      {item.label}
    </Link>
  )
  return (
    <>
      <SiteLoader />
      <a className="skip-link" href="#main">
        {ar ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>
      <PublicHeader store={store} navigation={navigation} labels={labels} cartCount={cartCount} />
      {config.review && (
        <div className="review-bar">
          {ar
            ? 'معاينة للمراجعة · بيانات تجريبية · لا توجد معاملات فعلية'
            : 'Review preview · Demonstration content · No live transactions'}
          <Link to={`${base}/dashboard`}>{ar ? 'معاينة لوحة التحكم' : 'Dashboard preview'}</Link>
        </div>
      )}
      <main ref={main} id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className={`public-footer${retail ? ' retail-footer' : ''}`}>
        <div className="footer-grid">
          <div>
            <Link to={base} className="brand-link">
              <Brand inverted />
            </Link>
            <p>
              {retail
                ? ar
                  ? 'ملابس لكل يوم. من نارمر.'
                  : 'Everyday clothing. Made by Narmer.'
                : ar
                  ? 'توريد الملابس وتصنيعها من نارمر إلى مشروعك.'
                  : 'Clothing supply and manufacturing. From Narmer to your business.'}
            </p>
          </div>
          <nav aria-label={retail ? labels.shop : ar ? 'الخدمات' : 'Services'}>
            <strong>{retail ? labels.shop : ar ? 'الخدمات' : 'Services'}</strong>
            {(retail
              ? navigation.filter((item) => item.key !== 'about')
              : navigation.find((item) => item.key === 'services')?.children || []
            ).map(link)}
          </nav>
          <nav aria-label={labels.help}>
            <strong>{labels.help}</strong>
            <Link to={`${base}/track`}>{labels.track}</Link>
            <Link to={`${base}/contact`}>{labels.contact}</Link>
          </nav>
          {retail && (
            <nav aria-label={labels.account}>
              <strong>{ar ? 'حسابك' : 'Your account'}</strong>
              <Link to={`${base}/account/login`}>{ar ? 'تسجيل الدخول' : 'Sign in'}</Link>
              <Link to={`${base}/wishlist`}>{labels.wishlist}</Link>
              <Link to={`${base}/cart`}>{labels.cart}</Link>
              <Link to={`${base}/orders`}>{ar ? 'طلباتك' : 'Your orders'}</Link>
            </nav>
          )}
          <nav aria-label={labels.info}>
            <strong>{labels.info}</strong>
            <Link to={`${base}/about`}>{labels.about}</Link>
            <Link to={`${base}/privacy`}>{labels.privacy}</Link>
            <Link to={`${base}/terms`}>{labels.terms}</Link>
            <LanguageLink />
          </nav>
        </div>
        <div className="footer-bottom footer-credits" lang="en" dir="ltr">
          <p>
            Developed by <a href="https://dtech-agency.com/">D-Tech</a> &amp;{' '}
            <a href="https://glitci.com/">Glitci Solutions</a>
          </p>
          <p>All rights reserved © 2026 Narmer Clothing Factory.</p>
        </div>
      </footer>
    </>
  )
}
