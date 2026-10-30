import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router'
import { Brand, Icon } from './Brand.jsx'
import { Button, Modal } from './Primitives.jsx'
import { LanguageLink, useLocale } from './Locale.jsx'

const desktopHover = () =>
  window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches

export function PublicHeader({ store, navigation, labels, cartCount }) {
  const language = useLocale(),
    ar = language === 'ar',
    base = `/${language}`
  const retail = store === 'b2c'
  const [drawer, setDrawer] = useState(false)
  const [category, setCategory] = useState({
    key: navigation.find((item) => item.dropdown)?.key,
    open: false,
  })
  const [mobileCategory, setMobileCategory] = useState(null)
  const [keyboard, setKeyboard] = useState(false)
  const header = useRef(null),
    panel = useRef(null),
    closeTimer = useRef(null),
    triggers = useRef({})

  const cancelClose = () => clearTimeout(closeTimer.current)
  function closeCategory() {
    cancelClose()
    setCategory((current) => ({ ...current, open: false }))
  }
  function openCategory(key, fromKeyboard = false) {
    cancelClose()
    setKeyboard(fromKeyboard)
    setCategory({ key, open: true })
  }
  function leaveHeader(event) {
    if (event.pointerType !== 'touch' && desktopHover())
      closeTimer.current = setTimeout(closeCategory, 120)
  }
  function closeDrawer() {
    setDrawer(false)
    setMobileCategory(null)
  }
  function followLink() {
    closeCategory()
    closeDrawer()
  }
  function escape(event) {
    if (event.key !== 'Escape' || !category.open) return
    event.preventDefault()
    flushSync(() => {
      setKeyboard(true)
      closeCategory()
    })
    const trigger = triggers.current[category.key]
    trigger?.focus()
    setTimeout(() => {
      if (
        trigger?.isConnected &&
        trigger.getAttribute('aria-expanded') === 'false' &&
        document.activeElement === document.body
      )
        trigger.focus()
    }, 0)
  }
  useEffect(() => () => clearTimeout(closeTimer.current), [])
  useEffect(() => {
    if (!category.open) return
    const outside = (event) => {
      if (!header.current?.contains(event.target))
        setCategory((current) => ({ ...current, open: false }))
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
    }
  }, [category.open])

  // Recreate links on opening so WebKit does not retain their hidden focus state.
  const categoryLinks = (key, expanded = category.open) =>
    navigation
      .find((item) => item.key === key)
      ?.children?.map((item) => (
        <Link
          key={`${item.key}:${expanded}`}
          to={`${base}${item.path}`}
          onClick={followLink}
          tabIndex={expanded ? 0 : -1}
        >
          {item.label}
        </Link>
      )) || (
      <>
        <Link
          key={`all:${key}:${expanded}`}
          to={`${base}/products?collection=${key}`}
          onClick={followLink}
          tabIndex={expanded ? 0 : -1}
        >
          {ar ? 'كل الملابس' : 'All clothing'}
        </Link>
        <Link
          key={`newest:${key}:${expanded}`}
          to={`${base}/products?collection=${key}&sort=newest`}
          onClick={followLink}
          tabIndex={expanded ? 0 : -1}
        >
          {ar ? 'وصل حديثًا' : 'New arrivals'}
        </Link>
      </>
    )
  const categoryItem = navigation.find((item) => item.key === category.key)
  const categoryPanel = (
    <div
      ref={panel}
      id="category-navigation"
      className="category-navigation"
      data-open={category.open}
      aria-hidden={!category.open}
      onPointerEnter={cancelClose}
    >
      {retail ? (
        <>
          <div className="retail-menu-heading">
            <h2>{categoryItem?.menu?.heading || categoryItem?.label}</h2>
            <button
              type="button"
              tabIndex={category.open ? 0 : -1}
              onClick={() => {
                closeCategory()
                triggers.current[category.key]?.focus()
              }}
            >
              {labels.close} <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="retail-menu-columns">
            <div className="retail-menu-categories">{categoryLinks(category.key)}</div>
            <div className="retail-menu-introduction">
              <h3>{ar ? 'من نارمر. بطريقتك.' : 'From Narmer. Worn your way.'}</h3>
              <p>
                {ar
                  ? 'اكتشف قطعًا يومية من المجموعة.'
                  : 'Explore everyday pieces from the collection.'}
              </p>
              <Link
                to={`${base}${categoryItem?.path || '/products'}`}
                onClick={followLink}
                tabIndex={category.open ? 0 : -1}
              >
                {ar ? 'استكشف المجموعة' : 'Explore the collection'}
                <Icon name="arrow" />
              </Link>
            </div>
            {categoryItem?.menu?.image && (
              <div className="retail-menu-media">
                <img className="retail-menu-image" src={categoryItem.menu.image} alt="" />
              </div>
            )}
          </div>
        </>
      ) : (
        categoryLinks(category.key)
      )}
    </div>
  )

  return (
    <>
      <header
        ref={header}
        className={`public-header ${retail ? 'retail-header' : 'business-header'}`}
        onKeyDown={escape}
        onPointerEnter={cancelClose}
        onPointerLeave={leaveHeader}
        data-keyboard={keyboard}
      >
        <div className="brand-strip">
          {retail
            ? ar
              ? 'نارمر / ملابس لكل يوم'
              : 'NARMER / EVERYDAY CLOTHING'
            : ar
              ? 'توريد الملابس وتصنيعها / مصر'
              : 'CLOTHING SUPPLY & MANUFACTURING / EGYPT'}
        </div>
        <div className="public-navigation">
          <Link
            to={base}
            aria-label={ar ? 'نارمر - الرئيسية' : 'Narmer - Home'}
            className="brand-link"
            onClick={followLink}
          >
            <Brand />
          </Link>
          <nav
            className="desktop-navigation"
            aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'}
          >
            {navigation.map((item) =>
              item.dropdown ? (
                <div className="desktop-dropdown" key={item.key}>
                  <button
                    type="button"
                    ref={(node) => {
                      triggers.current[item.key] = node
                    }}
                    aria-expanded={category.open && category.key === item.key}
                    aria-controls="category-navigation"
                    onPointerEnter={(event) => {
                      if (event.pointerType !== 'touch' && desktopHover()) openCategory(item.key)
                    }}
                    onClick={(event) => {
                      if (event.detail > 0 && desktopHover()) openCategory(item.key)
                      else if (category.open && category.key === item.key) closeCategory()
                      else openCategory(item.key, event.detail === 0)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        const trigger = event.currentTarget
                        flushSync(() => openCategory(item.key, true))
                        const firstLink = panel.current?.querySelector('a')
                        firstLink?.focus()
                        requestAnimationFrame(() => {
                          if (
                            firstLink?.isConnected &&
                            panel.current?.dataset.open === 'true' &&
                            (document.activeElement === document.body ||
                              document.activeElement === trigger)
                          )
                            firstLink.focus()
                        })
                      }
                    }}
                  >
                    {item.label}
                    <Icon name="chevron" />
                  </button>
                  {!retail && categoryPanel}
                </div>
              ) : (
                <Link
                  key={item.key}
                  to={`${base}${item.path}`}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'touch' && desktopHover()) closeCategory()
                  }}
                  onClick={followLink}
                >
                  {item.label}
                </Link>
              ),
            )}
            {!retail && <LanguageLink showIcon onClick={followLink} />}
          </nav>
          <div className="header-actions">
            {retail ? (
              <>
                {['account', 'wishlist', 'cart'].map((name) => (
                  <Link
                    key={name}
                    className="icon-button"
                    to={`${base}/${name}`}
                    aria-label={
                      name === 'cart' && cartCount != null
                        ? `${labels.cart}: ${cartCount} ${ar ? 'قطعة' : cartCount === 1 ? 'item' : 'items'}`
                        : labels[name]
                    }
                    onClick={followLink}
                  >
                    <Icon name={name} />
                    {name === 'cart' && cartCount > 0 && (
                      <span className="header-cart-count" aria-hidden="true">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>
                ))}
                <span className="retail-language-switch">
                  <LanguageLink showIcon onClick={followLink} />
                </span>
              </>
            ) : (
              <>
                <Button to={`${base}/request`} className="request-header">
                  {labels.request}
                </Button>
                <span className="desktop-language">
                  <LanguageLink showIcon onClick={followLink} />
                </span>
              </>
            )}
            <button
              type="button"
              className="icon-button mobile-menu-button"
              aria-label={labels.menu}
              aria-expanded={drawer}
              aria-haspopup="dialog"
              onClick={() => {
                closeCategory()
                setDrawer(true)
              }}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>
        {retail && categoryPanel}
      </header>
      <Modal open={drawer} onClose={closeDrawer} title={labels.menu} className="navigation-drawer">
        <nav aria-label={labels.menu}>
          {!navigation.some((item) => item.key === 'home') && (
            <Link to={base} onClick={followLink}>
              {labels.home}
            </Link>
          )}
          {navigation.map((item) =>
            item.dropdown ? (
              <div className="mobile-category" key={item.key}>
                <button
                  type="button"
                  className="mobile-category-toggle"
                  aria-expanded={mobileCategory === item.key}
                  aria-controls={`mobile-category-${item.key}`}
                  onClick={() => setMobileCategory(mobileCategory === item.key ? null : item.key)}
                >
                  {item.label}
                  <Icon name="chevron" />
                </button>
                <div
                  id={`mobile-category-${item.key}`}
                  className="mobile-category-links"
                  data-open={mobileCategory === item.key}
                  aria-hidden={mobileCategory !== item.key}
                  inert={mobileCategory !== item.key}
                >
                  <div>{categoryLinks(item.key, mobileCategory === item.key)}</div>
                </div>
              </div>
            ) : (
              <Link key={item.key} to={`${base}${item.path}`} onClick={followLink}>
                {item.label}
              </Link>
            ),
          )}
          {!retail && (
            <Link to={`${base}/request`} onClick={followLink}>
              {labels.request}
            </Link>
          )}
          <LanguageLink showIcon onClick={followLink} />
        </nav>
      </Modal>
    </>
  )
}
