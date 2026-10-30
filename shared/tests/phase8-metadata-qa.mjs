import assert from 'node:assert/strict'
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const results = []
for (const store of ['b2c', 'b2b']) {
  const root = resolve('output/phase8/' + store + '-metadata'),
    origin = 'https://' + store + '.example.test',
    routes = JSON.parse(await readFile(resolve(root, 'routes.json'), 'utf8')),
    sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8'),
    indexed = []
  for (const page of routes.pages) {
    const html = await readFile(resolve(root, page.file), 'utf8')
    assert.ok(html.includes('lang="' + page.language + '"'))
    assert.ok(html.includes('dir="' + (page.language === 'ar' ? 'rtl' : 'ltr') + '"'))
    assert.equal([...html.matchAll(/<title>/g)].length, 1, page.url)
    assert.ok(html.includes('rel="canonical" href="' + origin + page.url + '"'), page.url)
    assert.ok(!html.includes('<!--$?-->') && !html.includes('<div hidden id="S:'), page.url)
    const indexable = html.includes('name="robots" content="index, follow"')
    if (indexable) {
      indexed.push(origin + page.url)
      for (const language of ['en', 'ar'])
        assert.ok(
          html.includes(
            'hrefLang="' + language + '" href="' + origin + '/' + language + page.path + '"',
          ),
          page.url,
        )
    } else assert.ok(!sitemap.includes('<loc>' + origin + page.url + '</loc>'), page.url)
    if (['/privacy', '/terms'].includes(page.path) || (store === 'b2b' && page.path === '/about')) {
      assert.equal(indexable, false, page.url)
    }
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))
      JSON.parse(match[1])
  }
  const listed = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  assert.deepEqual(listed.sort(), indexed.sort())
  assert.equal(new Set(listed).size, listed.length)
  const scripts = [],
    bundleRoot = resolve('output/phase8/' + store + '-production')
  for (const file of await readdir(resolve(bundleRoot, 'assets/js'))) {
    const bytes = await readFile(resolve(bundleRoot, 'assets/js', file))
    scripts.push({ file, bytes: bytes.length, gzipBytes: gzipSync(bytes).length })
  }
  const license = await stat(resolve(root, 'licenses/poppins-OFL.txt'))
  assert.ok(license.size > 0)
  results.push({
    store,
    pages: routes.pages.length,
    indexablePages: indexed.length,
    siteOrigin: origin,
    scripts: scripts.sort((a, b) => b.gzipBytes - a.gzipBytes),
    bundleMode: 'Latest isolated unconfigured production build',
    warning: 'Synthetic reserved-domain metadata build. Not configured or approved for deployment.',
  })
}
await writeFile('output/phase8/metadata-and-bundles.json', JSON.stringify(results, null, 2))
console.log(
  results
    .map(
      (item) =>
        item.store +
        ': ' +
        item.pages +
        ' pages, ' +
        item.indexablePages +
        ' sitemap entries, canonical/language/placeholder/JSON-LD checks passed',
    )
    .join('\n'),
)
