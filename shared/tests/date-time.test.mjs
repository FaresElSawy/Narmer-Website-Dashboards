import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarDays, explicitDateTime, localDateTime } from '../lib/date-time.js'

test('calendar grids include leap days and correct adjacent-month days without duplicates', () => {
  const days = calendarDays(2024, 1)
  assert.equal(days.length, 42)
  assert.equal(new Set(days.map((day) => day.key)).size, 42)
  assert.equal(days[0].key, '2024-01-28')
  assert.ok(days.some((day) => day.key === '2024-02-29'))
  assert.equal(
    calendarDays(2025, 1).some((day) => day.key === '2025-02-29'),
    false,
  )
  assert.equal(calendarDays(2026, 11).at(-1).key, '2027-01-09')
})

test('local schedule values round-trip as explicit ISO instants and reject normalized invalid dates', () => {
  for (const local of ['2026-10-27T17:51', '2024-02-29T00:00', '2030-01-01T23:59']) {
    assert.equal(localDateTime(explicitDateTime(local)), local)
    assert.match(explicitDateTime(local), /Z$/)
  }
  for (const invalid of [
    '',
    '2025-02-29T10:00',
    '2026-04-31T10:00',
    '2026-10-27T24:00',
    '2026-10-27T10:60',
    '2026-10-27',
  ])
    assert.equal(explicitDateTime(invalid), null)
  assert.equal(localDateTime('invalid'), '')
})
