import { createContext, useContext, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import languageIcon from '../assets/images/language.svg'

const LocaleContext = createContext('en')

export function LocaleProvider({ language, children }) {
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])
  return <LocaleContext.Provider value={language}>{children}</LocaleContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useLocale() {
  return useContext(LocaleContext)
}

export function LanguageLink({ onClick, showIcon = false }) {
  const language = useLocale(),
    location = useLocation()
  const next = language === 'ar' ? 'en' : 'ar'
  return (
    <Link
      className="language-link"
      lang={next}
      onClick={onClick}
      to={location.pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${next}`) + location.search}
    >
      {showIcon && (
        <span
          className="language-link-icon"
          aria-hidden="true"
          style={{ '--language-icon': `url("${languageIcon}")` }}
        />
      )}
      <span dir={next === 'ar' ? 'rtl' : 'ltr'}>{next === 'ar' ? 'العربية' : 'English'}</span>
    </Link>
  )
}
