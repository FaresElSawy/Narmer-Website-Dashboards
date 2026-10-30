import { Link, NavLink } from 'react-router'
import { Icon } from '../../ui/Brand.jsx'
import { useLocale } from '../../ui/Locale.jsx'
import { useRuntime, useSession } from '../../ui/Runtime.jsx'
import '../../assets/css/account.css'

export function AccountFrame({ children }) {
  const language = useLocale(),
    ar = language === 'ar',
    { config } = useRuntime(),
    { user } = useSession()
  return (
    <div className="account-page">
      <header className="account-heading">
        <div>
          <p className="account-eyebrow">
            {ar ? 'نارمر / حساب العميل' : 'NARMER / CUSTOMER ACCOUNT'}
          </p>
          <h1>{ar ? 'حسابك' : 'Your account'}</h1>
          <p className="account-description">
            {ar
              ? config.store === 'b2c'
                ? 'بياناتك وعناوين التوصيل وطلباتك، في مكان واحد.'
                : 'إدارة بياناتك وعناوينك المحفوظة بسهولة.'
              : config.store === 'b2c'
                ? 'Your details, delivery addresses and orders, all in one place.'
                : 'Manage your details and saved addresses with ease.'}
          </p>
        </div>
        <Link to={`/${language}`} className="account-back">
          <span className="account-back-icon">
            <Icon name="arrow" />
          </span>
          {ar ? 'العودة إلى نارمر' : 'Back to Narmer'}
        </Link>
      </header>
      <nav className="account-nav" aria-label={ar ? 'تنقل الحساب' : 'Account navigation'}>
        <NavLink to={`/${language}/account`} end>
          {ar ? 'نظرة عامة' : 'Overview'}
        </NavLink>
        <NavLink to={`/${language}/account/profile`}>{ar ? 'الملف الشخصي' : 'Profile'}</NavLink>
        {user?.role === 'user' && (
          <NavLink to={`/${language}/account/addresses`}>
            {ar ? 'العناوين المحفوظة' : 'Saved addresses'}
          </NavLink>
        )}
        {config.store === 'b2c' && (
          <NavLink to={`/${language}/orders`}>{ar ? 'طلباتك' : 'Your orders'}</NavLink>
        )}
      </nav>
      <div className="account-content">{children}</div>
    </div>
  )
}
