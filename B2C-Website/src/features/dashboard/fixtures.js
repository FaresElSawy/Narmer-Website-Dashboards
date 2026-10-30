import { ApiError } from '../../../../shared/lib/api.js'
import { retailProducts } from '../shop/fixtures.js'
import { retailImages } from '../shop/images.js'
import { createCatalogFixture } from './catalog-fixtures.js'
import { createPromotionFixture } from './promotion-fixtures.js'
import { createStaffContentFixture } from './staff-fixtures.js'
import { createStaffOrdersFixture, staffOrderFixtureRows } from './order-fixtures.js'
import { createReportsFixture } from '../reports/fixtures.js'

export function createDashboardFixture() {
  const arabic = retailProducts('ar', retailImages)
  const products = retailProducts('en', retailImages).map((item, index) => ({
    ...item,
    name: { en: item.name, ar: arabic[index].name },
    description: { en: item.description, ar: arabic[index].description },
    options: item.options.map((option, i) => ({
      ...option,
      name: { en: option.name, ar: arabic[index].options[i].name },
      values: option.values.map((value, j) => ({
        ...value,
        name: { en: value.name, ar: arabic[index].options[i].values[j].name },
      })),
    })),
  }))
  const orders = staffOrderFixtureRows()
  const handlers = [
    createCatalogFixture(products),
    createPromotionFixture(),
    createStaffContentFixture(products),
    createStaffOrdersFixture(orders),
    createReportsFixture(orders, products),
  ]
  return async (path, options) => {
    for (const handler of handlers) {
      const result = await handler(path, options)
      if (result !== undefined) return result
    }
    throw new ApiError('NOT_FOUND', { status: 404 })
  }
}
