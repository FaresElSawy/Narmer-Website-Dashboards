import { formatMoney } from '../lib/money.js'

// Component-review records only. Business DTO fixtures belong to their feature modules.
export function foundationRows(store, language) {
  const ar = language === 'ar'
  if (store === 'b2b')
    return [
      {
        id: 'business-sample',
        fields: [
          [ar ? 'الخدمة' : 'Service', ar ? 'الأقمشة والتصنيع' : 'Fabric & manufacturing'],
          [ar ? 'الكمية' : 'Quantity', new Intl.NumberFormat(language).format(240)],
          [ar ? 'الحالة' : 'Status', ar ? 'جديد' : 'New'],
        ],
      },
    ]
  return [
    {
      id: 'sample-one',
      fields: [
        [ar ? 'الاسم' : 'Name', ar ? 'سويت شيرت نارمر' : 'Narmer sweatshirt'],
        [ar ? 'الحالة' : 'Status', ar ? 'متاح' : 'Available'],
        [ar ? 'القيمة' : 'Amount', formatMoney(74900, language)],
      ],
    },
    {
      id: 'sample-two',
      fields: [
        [
          ar ? 'الاسم' : 'Name',
          ar
            ? 'مثال باسم طويل للتحقق من عرض المحتوى على الهواتف الصغيرة'
            : 'A longer sample name to check wrapping on smaller mobile screens',
        ],
        [ar ? 'الحالة' : 'Status', ar ? 'غير متاح' : 'Unavailable'],
        [ar ? 'القيمة' : 'Amount', formatMoney(null, language)],
      ],
    },
  ]
}
