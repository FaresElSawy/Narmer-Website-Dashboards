import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const events = []
try {
  const pages = await Promise.all([context.newPage(), context.newPage()])
  for (const page of pages) {
    await page.exposeFunction('recordLock', (value) => events.push(value))
    await page.goto('http://127.0.0.1:5183/en')
  }
  await Promise.all(
    pages.map((page, index) =>
      page.evaluate(async (index) => {
        const { createSession } =
          await import('/@fs/D:/Web Projects/Narmer E-Commerce Website/shared/lib/session.js')
        const session = createSession('b2c')
        await session.refresh({
          request: async () => {
            await window.recordLock(`start-${index}`)
            await new Promise((resolve) => setTimeout(resolve, 80))
            await window.recordLock(`end-${index}`)
            return {
              user: { id: 'sample', name: 'Sample account', store: 'b2c', role: 'user' },
              accessToken: 'fixture-only',
              expiresIn: 900,
            }
          },
        })
      }, index),
    ),
  )
  assert.equal(events.length, 4)
  assert.ok(events[0].startsWith('start-') && events[1] === events[0].replace('start-', 'end-'))
  assert.ok(events[2].startsWith('start-') && events[3] === events[2].replace('start-', 'end-'))
  // Native browser locks are proven here; actual backend cookie rotation is a later live check.
  await writeFile(
    'output/playwright/phase-1/session-browser-results.json',
    JSON.stringify({ passed: true, events, liveCookiesVerified: false }, null, 2),
  )
  console.log('PASS: same-origin tabs serialize refresh through native Web Locks.')
} finally {
  await browser.close()
}
