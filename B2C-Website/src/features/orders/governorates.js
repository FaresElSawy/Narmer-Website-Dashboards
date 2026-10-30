const destinations = [
  ['cairo', 'Cairo', 'القاهرة'],
  ['giza', 'Giza', 'الجيزة'],
  ['alexandria', 'Alexandria', 'الإسكندرية'],
  ['dakahlia', 'Dakahlia', 'الدقهلية'],
  ['red-sea', 'Red Sea', 'البحر الأحمر'],
  ['beheira', 'Beheira', 'البحيرة'],
  ['fayoum', 'Fayoum', 'الفيوم'],
  ['gharbia', 'Gharbia', 'الغربية'],
  ['ismailia', 'Ismailia', 'الإسماعيلية'],
  ['menofia', 'Menofia', 'المنوفية'],
  ['minya', 'Minya', 'المنيا'],
  ['qalyubia', 'Qalyubia', 'القليوبية'],
  ['new-valley', 'New Valley', 'الوادي الجديد'],
  ['suez', 'Suez', 'السويس'],
  ['aswan', 'Aswan', 'أسوان'],
  ['assiut', 'Assiut', 'أسيوط'],
  ['beni-suef', 'Beni Suef', 'بني سويف'],
  ['port-said', 'Port Said', 'بورسعيد'],
  ['damietta', 'Damietta', 'دمياط'],
  ['sharqia', 'Sharqia', 'الشرقية'],
  ['south-sinai', 'South Sinai', 'جنوب سيناء'],
  ['kafr-el-sheikh', 'Kafr El Sheikh', 'كفر الشيخ'],
  ['matrouh', 'Matrouh', 'مطروح'],
  ['luxor', 'Luxor', 'الأقصر'],
  ['qena', 'Qena', 'قنا'],
  ['north-sinai', 'North Sinai', 'شمال سيناء'],
  ['sohag', 'Sohag', 'سوهاج'],
]
const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
export function governorates(language, overrides = []) {
  return destinations.map(([code, en, ar]) => {
    const configured = overrides.find(
      (row) =>
        row.governorateCode === code ||
        [en, ar].some((name) => normalize(row.name) === normalize(name)),
    )
    return { code: configured?.governorateCode || code, name: language === 'ar' ? ar : en }
  })
}
