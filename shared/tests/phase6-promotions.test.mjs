import test from 'node:test'
import assert from 'node:assert/strict'
import {
  couponPayload,
  salePayload,
  explicitDateTime,
} from '../../B2C-Website/src/features/dashboard/promotion-model.js'
import { shippingPayload } from '../../B2C-Website/src/features/dashboard/shipping-model.js'

const names = { en: 'Campaign', ar: 'حملة' }
const sale = {
  name: names,
  targetType: 'products',
  productIds: ['a'],
  categoryId: null,
  discountType: 'percentage',
  discountValue: 20,
  startsAt: '2026-10-26T10:00:00+02:00',
  endsAt: '2026-10-27T10:00:00+02:00',
  isEnabled: true,
}
test('sale payload keeps valid scope, ISO dates and whole-unit discount values', () => {
  assert.equal(salePayload(sale).startsAt, '2026-10-26T08:00:00.000Z')
  assert.throws(() => salePayload({ ...sale, discountValue: 20.5 }))
  assert.throws(() => salePayload({ ...sale, endsAt: sale.startsAt }))
})
test('coupon payload preserves uncapped and unbounded nulls while normalizing code', () => {
  const result = couponPayload({
    code: ' save-10 ',
    name: names,
    targetType: 'all',
    productIds: [],
    categoryId: null,
    discountType: 'fixed',
    discountValue: 100,
    minimumSpend: 0,
    maxUses: null,
    maxUsesPerPerson: null,
    startsAt: null,
    endsAt: null,
    isEnabled: true,
  })
  assert.equal(result.code, 'SAVE-10')
  assert.equal(result.maxUses, null)
  assert.equal(result.minimumSpend, 0)
  assert.equal(explicitDateTime(''), null)
})
test('shipping fees accept zero and reject decimals', () => {
  assert.equal(shippingPayload({ defaultFee: 0 }, true).defaultFee, 0)
  assert.throws(() => shippingPayload({ defaultFee: 1.25 }, true))
})
