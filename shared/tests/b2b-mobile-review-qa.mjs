import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/b2b-mobile-review')
const results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar']) {
      for (const width of [320, 360, 390, 440, 768, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 956 },
          hasTouch: width < 640,
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        const id = `${engine}-${language}-${width}`
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.route('https://narmer-ecommerce.vercel.app/**', (route) => {
          errors.push('Unexpected real backend request')
          return route.abort()
        })
        async function go(path = '') {
          await page.goto(`http://127.0.0.1:5284/${language}${path}`, {
            waitUntil: 'networkidle',
          })
          await page.evaluate(() => document.fonts.ready)
          await page.waitForFunction(() => !document.querySelector('.site-loader'))
        }
        async function fits() {
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth + 1,
            ),
            `${id}: horizontal page overflow at ${page.url()}`,
          )
          assert.ok(
            await page.locator('.staff-filters .field:visible').evaluateAll((nodes) =>
              nodes.every((node) => {
                const outer = node.getBoundingClientRect()
                return [...node.querySelectorAll('label,input:not([type=hidden]),button')]
                  .filter((child) => !child.classList.contains('narmer-select-native'))
                  .every((child) => {
                    const box = child.getBoundingClientRect()
                    return box.left >= outer.left - 1 && box.right <= outer.right + 1
                  })
              }),
            ),
            `${id}: filter content escapes its field`,
          )
        }
        async function screenshot(selector, name) {
          if (language === 'en' && [360, 440].includes(width))
            await page.locator(selector).screenshot({ path: resolve(output, `${id}-${name}.png`) })
        }
        try {
          await go()
          const heroButtons = page.locator('.business-campaign .campaign-actions .button')
          const heroBoxes = await heroButtons.evaluateAll((nodes) =>
            nodes.map((node) => {
              const box = node.getBoundingClientRect()
              const text = document.createRange()
              text.selectNodeContents(node)
              return {
                x: box.x,
                y: box.y,
                height: box.height,
                lines: text.getClientRects().length,
                width: box.width,
                font: getComputedStyle(node).fontSize,
                padding: getComputedStyle(node).paddingInline,
              }
            }),
          )
          if (width < 640) {
            assert.equal(heroBoxes.length, 2)
            if (width >= 360)
              assert.ok(Math.abs(heroBoxes[0].y - heroBoxes[1].y) < 1, `${id}: hero button row`)
            else assert.ok(heroBoxes[1].y >= heroBoxes[0].y + heroBoxes[0].height + 7)
            assert.ok(
              heroBoxes.every((box) => box.height >= 44 && box.lines === 1),
              `${id}: hero labels wrap ${JSON.stringify(heroBoxes)}`,
            )
            assert.ok(
              await page.locator('.business-step__label').evaluateAll((nodes) =>
                nodes.every((node) => {
                  const number = node.querySelector('span').getBoundingClientRect()
                  const title = node.querySelector('h3').getBoundingClientRect()
                  return (
                    number.width === 32 &&
                    Math.abs(number.y + number.height / 2 - title.y - title.height / 2) < 1
                  )
                }),
              ),
              `${id}: step number/title alignment`,
            )
          }
          await fits()
          await screenshot('.business-campaign', 'hero')
          await screenshot('.business-steps', 'steps')
          await go('/dashboard/requests')
          await page.locator('.staff-metrics strong').first().filter({ hasText: /\d/ }).waitFor()
          if (width < 640) {
            assert.ok(
              await page.locator('.staff-metrics .panel').evaluateAll((nodes) =>
                nodes.every((node) => {
                  const box = node.getBoundingClientRect()
                  const value = node.querySelector('strong').getBoundingClientRect()
                  return Math.abs(box.y + box.height / 2 - value.y - value.height / 2) < 1
                }),
              ),
              `${id}: summary value alignment`,
            )
            const boxes = await page
              .locator('.staff-metrics .panel')
              .evaluateAll((nodes) =>
                nodes.map((n) => ({ x: n.offsetLeft, y: n.offsetTop, width: n.offsetWidth })),
              )
            assert.ok(boxes.every((b) => b.width === boxes[0].width && b.x === boxes[0].x))
            assert.ok(boxes[1].y > boxes[0].y && boxes[2].y > boxes[1].y)
          }
          await fits()
          await screenshot('.staff-metrics', 'summary')
          await go('/dashboard/products')
          await page.locator('.staff-table tbody tr').first().waitFor()
          if (width < 640) {
            const tabs = await page.locator('.staff-tabs .button').evaluateAll((nodes) =>
              nodes.map((node) => ({
                y: node.getBoundingClientRect().y,
                height: node.getBoundingClientRect().height,
              })),
            )
            assert.ok(
              Math.abs(tabs[0].y - tabs[1].y) < 1 && tabs.every((b) => b.height >= 44),
              `${id}: source tabs row ${JSON.stringify(tabs)}`,
            )
          }
          await fits()
          await screenshot('.workspace-content', 'products')
          await go('/dashboard/accounts')
          await page.locator('.staff-table tbody tr').first().waitFor()
          await fits()
          if (width < 640) {
            const fields = await page.locator('.staff-filters > .field').evaluateAll((nodes) =>
              nodes.map((node) => ({
                top: node.getBoundingClientRect().top,
                bottom: node.getBoundingClientRect().bottom,
              })),
            )
            assert.ok(fields[1].top >= fields[0].bottom + 15, `${id}: account filters overlap`)
          }
          await screenshot('.staff-filters', 'accounts-filters')
          await page.locator('.staff-filters .narmer-select-trigger').last().click()
          await page.locator('[role=option]').last().waitFor()
          await page.keyboard.press('Escape')
          await go('/dashboard/notifications')
          await page.locator('.staff-table .staff-actions').first().waitFor()
          if (width < 640) {
            assert.ok(
              await page.locator('.staff-table .staff-actions').evaluateAll((nodes) =>
                nodes.every((node) => {
                  const children = [...node.children].map((n) => n.getBoundingClientRect())
                  return (
                    children.length < 2 ||
                    (Math.abs(children[0].y - children[1].y) < 1 &&
                      children.every((n) => n.height >= 44))
                  )
                }),
              ),
              `${id}: notification actions row`,
            )
          }
          await fits()
          await screenshot('.staff-table tbody tr:first-child', 'notification')
          await go('/dashboard/forms')
          await page.locator('.staff-service-options').waitFor()
          await fits()
          await screenshot('.staff-service-options', 'form-options')
          await go('/dashboard/wholesale')
          await page.locator('.staff-filters').waitFor()
          await fits()
          await page
            .getByRole('link', { name: ar ? 'إضافة عرض' : 'Add offer', exact: true })
            .click()
          await page
            .getByRole('heading', {
              name: ar ? 'إضافة عرض جملة' : 'Add wholesale offer',
              exact: true,
            })
            .waitFor()
          assert.equal(await page.locator('.staff-filters, .staff-table').count(), 0)
          assert.ok(
            await page
              .locator('.staff-editor .field')
              .first()
              .evaluate((node) => node.getBoundingClientRect().top < innerHeight),
          )
          await fits()
          await page
            .getByRole('link', {
              name: ar ? 'العودة إلى عروض الجملة' : 'Back to wholesale offers',
              exact: true,
            })
            .click()
          await page
            .getByRole('link', { name: ar ? 'تعديل العرض' : 'Edit offer', exact: true })
            .first()
            .click()
          await page
            .getByRole('heading', {
              name: ar ? 'تعديل عرض الجملة' : 'Edit wholesale offer',
              exact: true,
            })
            .waitFor()
          assert.equal(await page.locator('.staff-filters, .staff-table').count(), 0)
          assert.ok(
            await page
              .locator('.staff-editor .field')
              .first()
              .evaluate((node) => node.getBoundingClientRect().top < innerHeight),
          )
          await fits()
          assert.deepEqual(errors, [], id)
          results.push({ id, passed: true })
        } catch (error) {
          await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
          throw error
        } finally {
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} B2B responsive website/dashboard scenarios passed`)
