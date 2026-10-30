import test from 'node:test'
import assert from 'node:assert/strict'
import { chartMaximum, chartLine } from '../../B2C-Website/src/features/reports/chart.js'

test('chart scale covers zero, very small and large safe amounts with three equal intervals', () => {
  for (const values of [[0], [1], [79900, 84900], [Number.MAX_SAFE_INTEGER]]) {
    const maximum = chartMaximum(values)
    assert(maximum >= Math.max(...values))
    assert(Number.isFinite(maximum) && maximum > 0)
  }
  assert.equal(chartMaximum([84900]), 90000)
})
test('Figma-style curve keeps every original point and does not overshoot adjacent values', () => {
  assert.equal(chartLine([]), '')
  assert.equal(chartLine([[5, 10]]), 'M5,10')
  const points = [
    [0, 170],
    [10, 170],
    [20, 10],
    [30, 100],
  ]
  const path = chartLine(points)
  assert.equal(path, 'M0,170 C5,170 5,170 10,170 C15,170 15,10 20,10 C25,10 25,100 30,100')
  // Cubic Bezier samples must stay within their original interval in both axes.
  const segments = path.split(' C').slice(1)
  segments.forEach((segment, index) => {
    const [x1, y1, x2, y2, x3, y3] = segment.split(/[ ,]/).map(Number),
      [x0, y0] = points[index]
    for (let step = 0; step <= 10; step++) {
      const t = step / 10,
        u = 1 - t
      const x = u ** 3 * x0 + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * x3
      const y = u ** 3 * y0 + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * y3
      assert(x >= x0 - 1e-9 && x <= x3 + 1e-9)
      assert(y >= Math.min(y0, y3) - 1e-9 && y <= Math.max(y0, y3) + 1e-9)
    }
  })
})
