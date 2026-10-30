export function parseMoney(value) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value).trim())
  if (!match) throw new RangeError('Use a non-negative amount with at most two decimal places')
  const amount = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'))
  if (!Number.isSafeInteger(amount)) throw new RangeError('Amount exceeds the supported range')
  return amount
}

export function formatMoney(piastres, language = 'en') {
  if (piastres === null) return language === 'ar' ? 'غير متاح' : 'Unavailable'
  if (!Number.isSafeInteger(piastres)) throw new RangeError('Expected integer piastres')
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(piastres / 100)
}
