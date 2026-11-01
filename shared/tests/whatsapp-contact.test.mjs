import test from 'node:test'
import assert from 'node:assert/strict'
import { whatsappContactUrl } from '../../B2B-Website/src/features/dashboard/model.js'

test('request WhatsApp links use full international numbers without changing saved contact data', () => {
  for (const phone of ['01012345678', '+20 101 234 5678', '00201012345678', '201012345678'])
    assert.equal(whatsappContactUrl(phone), 'https://wa.me/201012345678')
  assert.equal(whatsappContactUrl('(011) 2345-6789'), 'https://wa.me/201123456789')
  assert.equal(whatsappContactUrl('+44 7700 900123'), 'https://wa.me/447700900123')
  assert.equal(whatsappContactUrl('0012025550123'), 'https://wa.me/12025550123')
})

test('missing or malformed numbers do not create misleading or unsafe WhatsApp links', () => {
  for (const phone of [
    null,
    undefined,
    '',
    'abc',
    '123',
    '+0000000000',
    '01012345678 ext 2',
    '+201012345678?text=hello',
    'javascript:alert(1)',
    '1234567890123456',
    '0201234',
  ])
    assert.equal(whatsappContactUrl(phone), null, String(phone))
})
