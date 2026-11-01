import { readConfig } from '../../../shared/lib/config.js'
import menMenuImage from '../assets/images/menu-men-maison.webp'
import womenMenuImage from '../assets/images/menu-women-pink.webp'
import kidsMenuImage from '../assets/images/kids-collection.png'
export const config = readConfig(import.meta.env, 'b2c')
export const navigation = (language, categories = []) => [
  { key: 'home', label: language === 'ar' ? 'الرئيسية' : 'Home', path: '' },
  {
    key: 'men',
    label: language === 'ar' ? 'رجالي' : 'Men',
    path: categories.find((item) => item.slug === 'men')
      ? `/products?categoryId=${categories.find((item) => item.slug === 'men').id}`
      : '/products?collection=men',
    dropdown: true,
    menu: {
      heading: language === 'ar' ? 'قسم الرجال' : 'Men’s Section',
      image: menMenuImage,
    },
    children: categoryLinks(categories, 'men', language),
  },
  {
    key: 'women',
    label: language === 'ar' ? 'حريمي' : 'Women',
    path: '/products?collection=women',
    dropdown: true,
    menu: {
      heading: language === 'ar' ? 'قسم النساء' : 'Women’s Section',
      image: womenMenuImage,
    },
    children: categoryLinks(categories, 'women', language),
  },
  {
    key: 'kids',
    label: language === 'ar' ? 'أطفال' : 'Kids',
    path: '/products?collection=kids',
    dropdown: true,
    menu: {
      heading: language === 'ar' ? 'قسم الأطفال' : 'Kids’ Section',
      image: kidsMenuImage,
    },
    children: categoryLinks(categories, 'kids', language),
  },
  {
    key: 'new',
    label: language === 'ar' ? 'وصل حديثًا' : 'New Arrivals',
    path: '/products?sort=newest',
  },
  { key: 'sale', label: language === 'ar' ? 'التخفيضات' : 'Sale', path: '/products?saleOnly=true' },
  { key: 'about', label: language === 'ar' ? 'عن نارمر' : 'About', path: '/about' },
]

function categoryLinks(categories, slug, language) {
  const root = categories.find((item) => item.slug === slug)
  if (!root)
    return [
      {
        key: slug,
        label: language === 'ar' ? 'عرض المجموعة' : 'View collection',
        path: `/products?collection=${slug}`,
      },
    ]
  const children = (nodes) =>
    nodes.flatMap((item) => [
      { key: item.id, label: item.name, path: `/products?categoryId=${item.id}` },
      ...children(item.children || []),
    ])
  return [
    {
      key: root.id,
      label: language === 'ar' ? 'كل الملابس' : 'All clothing',
      path: `/products?categoryId=${root.id}`,
    },
    ...children(root.children || []),
    {
      key: `${root.id}:new`,
      label: language === 'ar' ? 'وصل حديثًا' : 'New arrivals',
      path: `/products?categoryId=${root.id}&sort=newest`,
    },
  ]
}
