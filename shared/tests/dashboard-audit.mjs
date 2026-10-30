import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/dashboard-audit'),
  results = [],
  errors = []
await mkdir(output, { recursive: true })
const routes = [
  'requests',
  'requests/0000000000000000000007d2',
  'forms/fabric',
  'products',
  'products/0000000000000000000000c8',
  'products/source/0000000000000000000000ca',
  'wholesale/0000000000000000000001f6',
  'accounts/000000000000000000000bb8',
  'notifications',
  'profile',
  'homepage',
  'settings',
]
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar'])
    for (const width of [320, 1024]) {
      if (
        engine === 'webkit' &&
        ((language === 'ar' && width === 1024) || (language === 'en' && width === 320))
      )
        continue
      const context = await browser.newContext({
          viewport: { width, height: 768 },
          reducedMotion: 'reduce',
        }),
        page = await context.newPage()
      page.on('pageerror', (error) =>
        errors.push({ engine, language, width, message: error.message }),
      )
      for (const route of routes) {
        await page.goto(`http://127.0.0.1:5284/${language}/dashboard/${route}`)
        await page.locator('#workspace h1').waitFor()
        await page.waitForFunction(() => !document.querySelector('#workspace [aria-busy="true"]'))
        const inspection = await page.locator('.dashboard').evaluate((root) => {
          const visible = (node) => {
              const r = node.getBoundingClientRect()
              return (
                r.width > 2 &&
                r.height > 2 &&
                getComputedStyle(node).visibility !== 'hidden' &&
                !node.closest('[aria-hidden="true"],dialog:not([open])')
              )
            },
            rgb = (color) => (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number),
            lum = (color) =>
              rgb(color)
                .map((v) => {
                  v /= 255
                  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
                })
                .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0),
            ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05),
            describe = (node) => ({
              tag: node.tagName,
              text: (node.innerText || node.getAttribute('aria-label') || node.name || '').slice(
                0,
                80,
              ),
              class: node.className,
            }),
            controls = [
              ...root.querySelectorAll('button,a,input,textarea,[role="combobox"]'),
            ].filter(visible),
            text = [...root.querySelectorAll('p,span,label,th,td,button,a,h1,h2,h3,small')].filter(
              (node) =>
                visible(node) &&
                [...node.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
                !node.closest(':disabled'),
            ),
            contrast = text.flatMap((node) => {
              const style = getComputedStyle(node)
              let ancestor = node,
                background = 'rgb(255,255,255)'
              while (ancestor) {
                const bg = getComputedStyle(ancestor).backgroundColor
                if (!bg.endsWith(', 0)') && bg !== 'transparent') {
                  background = bg
                  break
                }
                ancestor = ancestor.parentElement
              }
              const value = ratio(style.color, background),
                large =
                  parseFloat(style.fontSize) >= 24 ||
                  (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700)
              return value < (large ? 3 : 4.5) - 0.01
                ? [
                    {
                      ...describe(node),
                      ratio: Number(value.toFixed(2)),
                      foreground: style.color,
                      background,
                    },
                  ]
                : []
            })
          return {
            overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
            headingCount: root.querySelectorAll('h1').length,
            duplicateIds: [...root.querySelectorAll('[id]')]
              .map((n) => n.id)
              .filter((id, i, all) => all.indexOf(id) !== i),
            clippedControls: controls
              .filter(
                (n) =>
                  n.scrollWidth > n.clientWidth + 3 &&
                  getComputedStyle(n).overflowX !== 'visible' &&
                  !n.matches('input,textarea'),
              )
              .map(describe),
            smallTargets: controls
              .filter((n) => {
                const r = n.getBoundingClientRect()
                return (
                  !n.matches(':disabled,input[type="checkbox"]') && (r.height < 24 || r.width < 24)
                )
              })
              .map(describe),
            contrast,
          }
        })
        const name = `${engine}-${language}-${width}-${route.split('/')[0]}`
        results.push({ engine, language, width, route, ...inspection })
        if (
          [
            'requests',
            'forms/fabric',
            'products/0000000000000000000000c8',
            'accounts/000000000000000000000bb8',
            'settings',
          ].includes(route)
        )
          await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true })
      }
      await context.close()
    }
  await browser.close()
}
await writeFile(resolve(output, 'inspection.json'), JSON.stringify({ results, errors }, null, 2))
console.log(
  JSON.stringify(
    {
      screens: results.length,
      errors,
      overflow: results.filter((r) => r.overflow).map((r) => [r.route, r.width]),
      clipped: results
        .filter((r) => r.clippedControls.length)
        .map((r) => [r.route, r.clippedControls]),
      small: [...new Set(results.flatMap((r) => r.smallTargets.map((n) => n.text)))],
      contrast: [
        ...new Set(results.flatMap((r) => r.contrast.map((n) => `${n.class}: ${n.ratio}`))),
      ],
    },
    null,
    2,
  ),
)
