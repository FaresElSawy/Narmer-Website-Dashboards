import { Link } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime } from '../../../shared/ui/Runtime.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import '../assets/css/business-content.css'

const infoCopy = {
  about: {
    en: [
      'About Narmer',
      'Information about Narmer and its services is being reviewed for this preview.',
    ],
    ar: ['عن نارمر', 'تتم مراجعة المعلومات الخاصة بنارمر وخدماتها لهذه المعاينة.'],
  },
  privacy: {
    en: [
      'Privacy',
      'The privacy notice is being prepared and reviewed before publication. This preview does not describe the final policy.',
    ],
    ar: [
      'الخصوصية',
      'يتم إعداد ومراجعة إشعار الخصوصية قبل النشر. لا توضح هذه المعاينة السياسة النهائية.',
    ],
  },
  terms: {
    en: [
      'Terms',
      'The terms are being prepared and reviewed before publication. This preview does not describe the final terms.',
    ],
    ar: ['الشروط', 'يتم إعداد ومراجعة الشروط قبل النشر. لا توضح هذه المعاينة الشروط النهائية.'],
  },
}

export function InformationPage({ page = 'about' }) {
  const language = useLocale(),
    ar = language === 'ar',
    { config } = useRuntime(),
    content = infoCopy[page] || infoCopy.about,
    [title, description] = content[language]
  const infoNav = Object.keys(infoCopy)
  return (
    <>
      <Metadata
        config={config}
        title={`${title} | ${ar ? 'نارمر للأعمال' : 'Narmer for Business'}`}
        description={description}
        path={`/${page}`}
        publicPage={false}
      />
      <div className="business-information-layout">
        <nav
          className="business-information-nav"
          aria-label={ar ? 'صفحات المعلومات' : 'Information pages'}
        >
          {infoNav.map((key) => {
            const label = infoCopy[key][language][0]
            return (
              <Link
                key={key}
                to={`/${language}/${key}`}
                aria-current={key === page ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>
        <article className="business-information" aria-labelledby="business-information-title">
          <p className="eyebrow">{ar ? 'معلومات' : 'INFORMATION'}</p>
          <h1 id="business-information-title">{title}</h1>
          <section>
            <h2>{ar ? 'حول هذه الصفحة' : 'About this page'}</h2>
            <p className="business-lead">{description}</p>
          </section>
          <section>
            <h2>{ar ? 'المحتوى قيد المراجعة' : 'Content under review'}</h2>
            <p>
              {ar
                ? 'محتوى تجريبي للمراجعة، وسيتم استبداله بالنص المعتمد قبل النشر.'
                : 'Demonstration review copy. Approved wording is needed before publication.'}
            </p>
          </section>
        </article>
      </div>
    </>
  )
}
