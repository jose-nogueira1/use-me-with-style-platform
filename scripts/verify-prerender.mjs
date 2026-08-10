import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MARKETS, STATIC_PRERENDER_ROUTES } from './prerender-lib.mjs'

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(projectDir, 'dist')
const manifest = JSON.parse(await readFile(path.join(distDir, 'prerender-manifest.json'), 'utf8'))
const failures = []

function expect(condition, message) {
  if (!condition) failures.push(message)
}

try {
  const spaFallback = await readFile(path.join(distDir, '__spa.html'), 'utf8')
  expect(spaFallback.includes('<div id="root"></div>'), 'SPA fallback is missing its empty React root')
} catch {
  failures.push('SPA fallback __spa.html is missing')
}

try {
  const notFoundFallback = await readFile(path.join(distDir, '404.html'), 'utf8')
  expect(notFoundFallback.includes('<div id="root"></div>'), '404 document is missing its React root')
  expect(notFoundFallback.includes('<meta name="robots" content="noindex,follow"'), '404 document is missing robots noindex')
  expect(!notFoundFallback.includes('data-prerendered="true"'), '404 document must not pretend to be a prerendered route')
} catch {
  failures.push('Static 404.html is missing')
}

function jsonLdBlocks(html) {
  const parsed = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => {
      try { return JSON.parse(match[1]) } catch { return null }
    })
    .filter(Boolean)
  return parsed.flatMap((block) => Array.isArray(block['@graph']) ? block['@graph'] : [block])
}

for (const [market, config] of Object.entries(MARKETS)) {
  const entries = manifest.markets?.[market] ?? []
  const routes = new Set(entries.map((entry) => entry.route))
  for (const route of STATIC_PRERENDER_ROUTES) expect(routes.has(route), `${market} is missing static route ${route}`)
  expect(entries.some((entry) => entry.route.startsWith('/produto/')), `${market} has no product pages`)

  for (const entry of entries) {
    const label = `${market} ${entry.route}`
    let html = ''
    try { html = await readFile(path.join(distDir, entry.file), 'utf8') } catch { failures.push(`${label} output file is missing`); continue }
    const blocks = jsonLdBlocks(html)
    const canonical = entry.url
    expect(html.includes('data-prerendered="true"'), `${label} lacks the prerender marker`)
    expect(html.includes(`name="ump-prerender" content="market=${market};`), `${label} has the wrong market marker`)
    expect(!html.includes('.localhost:'), `${label} leaks a local origin`)
    expect(!html.includes(`https://${config.host}/assets/`), `${label} hardcodes its asset origin`)
    expect(!html.includes('aria-label="Preferências de cookies"'), `${label} captured the cookie-consent banner`)
    expect(html.includes(`<link rel="canonical" href="${canonical}">`), `${label} has an incorrect canonical URL`)
    expect(html.includes(`hreflang="pt-AO" href="https://ao.usemewithstyle.shop${entry.route === '/' ? '/' : entry.route}"`), `${label} lacks the AO alternate`)
    expect(html.includes(`hreflang="pt-PT" href="https://pt.usemewithstyle.shop${entry.route === '/' ? '/' : entry.route}"`), `${label} lacks the PT alternate`)
    expect(html.includes(`hreflang="x-default" href="https://usemewithstyle.shop${entry.route === '/' ? '/' : entry.route}"`), `${label} lacks the x-default alternate`)
    expect(/<meta name="description" content=".{40,}"/i.test(html), `${label} lacks a useful description`)
    expect(/<h1\b/i.test(html), `${label} lacks crawlable H1 content`)
    expect(blocks.some((block) => block['@type'] === 'Organization'), `${label} lacks Organization JSON-LD`)
    expect(blocks.some((block) => block['@type'] === 'WebSite'), `${label} lacks WebSite JSON-LD`)
    expect(!/<img(?=[^>]*data-artwork)(?=[^>]*alt="")[^>]*>/i.test(html), `${label} contains a product image with empty alt text`)

    if (entry.route.startsWith('/produto/')) {
      const product = blocks.find((block) => block['@type'] === 'Product')
      expect(Boolean(product), `${label} lacks Product JSON-LD`)
      expect(product?.offers?.priceCurrency === config.currency, `${label} uses the wrong Product currency`)
      expect(product?.offers?.url === canonical, `${label} has the wrong Product offer URL`)
      expect(typeof product?.name === 'string' && product.name.length > 0, `${label} lacks a Product name`)
      if ((product?.image?.length ?? 0) > 0) {
        expect(/<img(?=[^>]*data-artwork)(?=[^>]*alt="[^"]+")[^>]*>/i.test(html), `${label} omits its crawlable product image or alt text`)
      }
    }
    if (entry.route === '/catalogo') {
      expect(/href="\/produto\//.test(html), `${label} contains no crawlable product links`)
    }
    if (entry.route === '/perguntas-frequentes') {
      const faq = blocks.find((block) => block['@type'] === 'FAQPage')
      expect(Boolean(faq), `${label} lacks FAQPage JSON-LD`)
      expect((faq?.mainEntity?.length ?? 0) >= 5, `${label} has too few FAQ questions`)
      expect(/<details\b/i.test(html) && /<summary\b/i.test(html), `${label} lacks crawlable FAQ accordion content`)
    }
  }
}

for (const prefix of ['/admin', '/checkout', '/carrinho', '/conta', '/encomenda-confirmada']) {
  const leaked = Object.values(manifest.markets).flat().some((entry) => entry.route === prefix || entry.route.startsWith(`${prefix}/`))
  expect(!leaked, `Runtime-only route was prerendered: ${prefix}`)
}

if (failures.length > 0) {
  throw new Error(`Prerender verification failed (${failures.length}):\n- ${failures.join('\n- ')}`)
}

console.log(`Verified ${Object.values(manifest.markets).flat().length} prerendered pages across AO and PT.`)
