import logo from '../../../../shared/assets/images/offer-logo.webp'
import white from '../../../../shared/assets/images/campaign-men.webp'
import quarter from '../../../../shared/assets/images/offer-quarter.webp'
import green from '../../../../shared/assets/images/campaign-women.webp'
import brown from '../../assets/images/brown.webp'
import mission from '../../assets/images/mission.webp'
import blue from '../../assets/images/blue.webp'
import ivory from '../../assets/images/ivory.webp'
import art from '../../assets/images/art.webp'
import pink from '../../assets/images/pink.webp'
import logoDetail from '../../assets/images/logoDetail.webp'
import { reviewCatalogue } from '../../content/catalogue.js'

const galleryFiles = import.meta.glob('../../assets/images/products/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const retailImages = Object.fromEntries(
  Object.entries({
    logo,
    white,
    quarter,
    green,
    brown,
    mission,
    blue,
    ivory,
    art,
    pink,
    logoDetail,
  }).map(([key, url], index) => [
    key,
    {
      id: (900 + index).toString(16).padStart(24, '0'),
      url,
      width: ['white', 'green'].includes(key)
        ? 960
        : ['mission', 'art'].includes(key)
          ? 1024
          : 1200,
      height: ['white', 'green'].includes(key)
        ? 960
        : ['mission', 'art'].includes(key)
          ? 1024
          : 1200,
    },
  ]),
)

retailImages.galleries = Object.fromEntries(
  reviewCatalogue.map((product, index) => [
    product.slug,
    product.gallery.map((image, position) => ({
      id: (10000 + index * 10 + position).toString(16).padStart(24, '0'),
      url: galleryFiles[`../../assets/images/products/${image.file}`],
      width: image.width,
      height: image.height,
    })),
  ]),
)
