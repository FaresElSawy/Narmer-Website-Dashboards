import logoNavy from '../assets/images/logo-navy.webp'
import logoWhite from '../assets/images/logo-white.webp'
import account from '../assets/images/account.svg'
import cart from '../assets/images/cart.svg'
import wishlist from '../assets/images/wishlist.svg'
import menu from '../assets/images/menu.svg'

const icons = { account, cart, wishlist, menu }
export function Icon({ name }) {
  if (name === 'edit')
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 5Z" />
      </svg>
    )
  if (name === 'trash' || name === 'calendar')
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {name === 'trash' ? (
          <>
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
          </>
        ) : (
          <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4M17 3v4M3 11h18M7 15h2M13 15h2" />
          </>
        )}
      </svg>
    )
  if (name === 'buy')
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m13 3-8 10h6l-1 8 9-11h-6l1-7Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  if (name === 'arrow')
    return (
      <svg
        className="directional-arrow"
        width="16"
        height="16"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 9h12m-5-5 5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  if (name === 'chevron')
    return (
      <svg
        className="dropdown-chevron"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m3 4.5 3 3 3-3"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  return <img className="icon" src={icons[name]} width="24" height="24" alt="" aria-hidden="true" />
}
export function Brand({ inverted = false }) {
  return (
    <span className="brand-crop">
      <img src={inverted ? logoWhite : logoNavy} width="140" height="140" alt="Narmer | نارمر" />
    </span>
  )
}
