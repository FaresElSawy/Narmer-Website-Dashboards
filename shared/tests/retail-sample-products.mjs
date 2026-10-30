// Synthetic products exercise pricing, pagination and unavailable combinations only in tests.
import { fixtureId } from '../../B2C-Website/src/features/shop/fixtures.js'

const names = [
  ['Logo hoodie', 'هودي الشعار', 'logo-hoodie', 'logo'],
  ['Everyday sweatshirt', 'سويت شيرت يومي', 'everyday-sweatshirt', 'white'],
  ['Quarter-zip sweatshirt', 'سويت شيرت نص سحاب', 'quarter-zip-sweatshirt', 'quarter'],
  ['Graphic hoodie', 'هودي بطباعة', 'graphic-hoodie', 'green'],
  ['Mission sweatshirt - black', 'سويت شيرت ميشن - أسود', 'mission-sweatshirt', 'mission'],
  ['Graphic sweatshirt - blue', 'سويت شيرت بطباعة - أزرق', 'blue-sweatshirt', 'blue'],
  ['NYC quarter-zip - ivory', 'نص سحاب نيويورك - عاجي', 'nyc-quarter-zip', 'ivory'],
  ['Art sweatshirt - black', 'سويت شيرت فني - أسود', 'art-sweatshirt', 'art'],
  ['Pink hoodie', 'هودي وردي', 'pink-hoodie', 'pink'],
  ['Everyday cotton top', 'بلوزة قطن يومية', 'cotton-top', null],
  ['Essential sweatshirt', 'سويت شيرت أساسي', 'essential-sweatshirt', 'white'],
  ['Relaxed hoodie', 'هودي بقصة مريحة', 'relaxed-hoodie', 'logo'],
  ['Everyday layer', 'قطعة لكل يوم', 'everyday-layer', 'green'],
]
const local = (en, ar, language) => (language === 'ar' ? ar : en)
export function commerceProducts(language = 'en', images = {}) {
  return names.map(([en, ar, slug, image], index) => {
    const product = {
      id: fixtureId(100 + index),
      type: index === 0 ? 'variant' : 'simple',
      categoryId: fixtureId(index % 2 === 0 ? 10 : 20),
      name: local(en, ar, language),
      slug,
      description: local(
        'An everyday layer from the Narmer collection. Demonstration product details.',
        'قطعة يومية من مجموعة نارمر. تفاصيل منتج تجريبية.',
        language,
      ),
      isActive: true,
      currency: 'EGP',
      images: image && images[image] ? [images[image]] : [],
      sizeChart:
        index === 0
          ? {
              id: fixtureId(700),
              name: local('Hoodie size guide', 'دليل مقاسات الهودي', language),
              image: null,
              alt: '',
              measurements: {
                unit: 'cm',
                rows: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size, i) => ({
                  size,
                  chest: 48 + i * 2,
                  length: 64 + i * 2,
                  sleeve: 58 + i,
                })),
              },
            }
          : null,
    }
    if (index === 0) {
      product.options = [
        {
          key: 'color',
          name: local('Color', 'اللون', language),
          values: [
            { key: 'beige', name: local('Beige', 'بيج', language) },
            { key: 'brown', name: local('Brown', 'بني', language) },
          ],
        },
        {
          key: 'size',
          name: local('Size', 'المقاس', language),
          values: ['s', 'm', 'l', 'xl', 'xxl', 'xxxl'].map((key) => ({
            key,
            name: key.toUpperCase(),
          })),
        },
      ]
      product.variants = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl']
        .map((size, i) => ({
          id: fixtureId(200 + i),
          values: { color: 'beige', size },
          sku: null,
          price: 75000,
          discountedPrice: null,
          effectivePrice: 75000,
          activeSale: null,
          stock: i === 3 ? 0 : 12000,
          images: [...product.images, ...(images.logoDetail ? [images.logoDetail] : [])],
        }))
        .concat([
          {
            id: fixtureId(210),
            values: { color: 'brown', size: 'm' },
            sku: null,
            price: 79000,
            discountedPrice: 69900,
            effectivePrice: 69900,
            activeSale: null,
            stock: 12,
            images: images.brown ? [images.brown] : [],
          },
        ])
      product.priceFrom = 69900
    } else
      Object.assign(product, {
        sku: null,
        price: 79900,
        discountedPrice: index === 9 ? 0 : index % 3 === 0 ? 59900 : null,
        effectivePrice: index === 9 ? 0 : index % 3 === 0 ? 59900 : 79900,
        stock: index === 10 ? 0 : 15000,
        activeSale: null,
      })
    return product
  })
}
