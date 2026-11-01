import test from 'node:test'
import assert from 'node:assert/strict'
import { colorSwatch } from '../../B2C-Website/src/features/shop/colors.js'

test('known English and Arabic color labels render independently of legacy value keys', () => {
  for (const name of ['Gold', 'gold', 'ذهبي', 'ذهبى', 'الذهبي', 'دهبي'])
    assert.equal(colorSwatch({ key: 'fares', name }), '#d4af37', name)
  assert.equal(colorSwatch({ key: 'red', name: 'Gold' }), '#d4af37')
  assert.equal(colorSwatch({ key: 'custom', name: 'أسود' }), '#232323')
  assert.equal(colorSwatch({ key: 'custom', name: 'أبيض' }), '#fff')
})
test('existing palette keys remain valid and unknown labels retain a neutral swatch', () => {
  assert.equal(colorSwatch({ key: 'beige', name: 'Custom label' }), '#b8ac94')
  assert.equal(colorSwatch({ key: 'custom', name: 'Unknown color' }), '#d1d4d3')
  assert.equal(colorSwatch({ key: 'constructor', name: 'constructor' }), '#d1d4d3')
})

test('standard CSS names and common Arabic equivalents support spaces and case', () => {
  for (const [name, expected] of [
    [' Blue ', '#6387aa'],
    ['Light Blue', 'lightblue'],
    ['dark-red', 'darkred'],
    ['SILVER', 'silver'],
    ['Orange', 'orange'],
    ['Purple', 'purple'],
    ['Rebecca Purple', 'rebeccapurple'],
    ['أزرق', '#6387aa'],
    ['الأزرق الفاتح', 'lightblue'],
    ['ذَهَبِيّ', '#d4af37'],
    ['فضي', 'silver'],
  ])
    assert.equal(colorSwatch({ key: 'legacy', name }), expected, name)
  assert.equal(colorSwatch({ key: 'light-blue', name: 'لون خاص' }), 'lightblue')
  for (const name of [
    'transparent',
    'currentcolor',
    'inherit',
    'var(--color)',
    'url(example)',
    'constructor',
  ])
    assert.equal(colorSwatch({ key: 'unknown', name }), '#d1d4d3', name)
})
