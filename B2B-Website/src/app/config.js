import { readConfig } from '../../../shared/lib/config.js'
export const config = readConfig(import.meta.env, 'b2b')
export const serviceLinks = (language) => [
  { key: 'spinning', label: language === 'ar' ? 'الغزل' : 'Spinning', path: '/services/spinning' },
  { key: 'weaving', label: language === 'ar' ? 'النسيج' : 'Weaving', path: '/services/weaving' },
  {
    key: 'fabric',
    label: language === 'ar' ? 'الأقمشة والتصنيع' : 'Fabric & manufacturing',
    path: '/services/fabric',
  },
  {
    key: 'school-uniforms',
    label: language === 'ar' ? 'الزي المدرسي' : 'School uniforms',
    path: '/services/school-uniforms',
  },
  { key: 'wholesale', label: language === 'ar' ? 'الجملة' : 'Wholesale', path: '/wholesale' },
]
export const navigation = (language) => [
  { key: 'home', label: language === 'ar' ? 'الرئيسية' : 'Home', path: '' },
  { key: 'about', label: language === 'ar' ? 'عن نارمر' : 'About Narmer', path: '/about' },
  {
    key: 'services',
    label: language === 'ar' ? 'الخدمات' : 'Services',
    dropdown: true,
    children: serviceLinks(language),
  },
]
