import { access, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import serverlessChromium from '@sparticuz/chromium'
import { chromium as playwrightChromium } from '@playwright/test'
import {
  MARKETS,
  STATIC_PRERENDER_ROUTES,
  outputFileForRoute,
  productionUrl,
  uniqueRoutes,
} from './prerender-lib.mjs'

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(projectDir, 'dist')
const cmsOrigin = (process.env.PRERENDER_CMS_ORIGIN || 'https://use-me-with-style-cms-production.up.railway.app').replace(/\/$/, '')
const generatedAt = new Date().toISOString()
const responseCache = new Map()
const useServerlessChromium = process.env.VERCEL === '1' && process.platform === 'linux'

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

async function ensureBrowser() {
  try {
    await access(playwrightChromium.executablePath())
    return
  } catch {
    console.log('Playwright Chromium is not installed; downloading the pinned browser for prerendering...')
  }

  const env = { ...process.env }
  delete env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
  const result = spawnSync(process.execPath, [path.join(projectDir, 'node_modules/playwright/cli.js'), 'install', 'chromium'], {
    cwd: projectDir,
    env,
    stdio: 'inherit',
  })
  if (result.status !== 0) throw new Error('Unable to install Playwright Chromium for prerendering.')
  await access(playwrightChromium.executablePath())
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`CMS discovery failed: ${response.status} ${url}`)
  return response.json()
}

async function discoverProductRoutes(market) {
  const availability = market === 'AO' ? 'availableAO' : 'availablePT'
  const routes = []
  let page = 1
  let totalPages = 1
  do {
    const url = new URL(`${cmsOrigin}/api/products`)
    url.searchParams.set('where[active][equals]', 'true')
    url.searchParams.set(`where[${availability}][equals]`, 'true')
    url.searchParams.set('limit', '100')
    url.searchParams.set('page', String(page))
    url.searchParams.set('depth', '0')
    const data = await fetchJson(url)
    for (const product of data.docs ?? []) {
      if (typeof product.slug === 'string' && product.slug.trim()) {
        routes.push(`/produto/${encodeURIComponent(product.slug.trim())}`)
      }
    }
    totalPages = Number(data.totalPages) || 1
    page += 1
  } while (page <= totalPages)

  if (routes.length === 0) throw new Error(`CMS returned no active ${market} product routes; refusing to publish an empty prerender.`)
  return routes
}

async function discoverInstagramRoutes(market) {
  const url = new URL(`${cmsOrigin}/api/instagram-feed`)
  url.searchParams.set('limit', '12')
  url.searchParams.set('market', market)
  const data = await fetchJson(url)
  return (data.posts ?? [])
    .filter((post) => typeof post.lookSlug === 'string' && post.lookSlug.trim() && (post.products?.length ?? 0) > 0)
    .map((post) => `/shop-instagram/${encodeURIComponent(post.lookSlug.trim())}`)
}

async function proxyApi(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end('Prerender proxy only permits reads.')
    return
  }
  const target = `${cmsOrigin}${request.url}`
  let cached = responseCache.get(target)
  if (!cached) {
    const upstream = await fetch(target, { headers: { accept: request.headers.accept || '*/*' } })
    cached = {
      body: Buffer.from(await upstream.arrayBuffer()),
      contentType: upstream.headers.get('content-type') || 'application/octet-stream',
      status: upstream.status,
    }
    if (upstream.ok) responseCache.set(target, cached)
  }
  response.writeHead(cached.status, { 'content-type': cached.contentType, 'cache-control': 'no-store' })
  response.end(request.method === 'HEAD' ? undefined : cached.body)
}

async function serveStatic(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  if (pathname.startsWith('/api/')) return proxyApi(request, response)

  const requested = pathname === '/' ? '/index.html' : pathname
  const resolved = path.resolve(distDir, `.${requested}`)
  if (!resolved.startsWith(`${distDir}${path.sep}`) && resolved !== path.join(distDir, 'index.html')) {
    response.writeHead(400).end('Invalid path.')
    return
  }

  let file = resolved
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html')
    const body = await readFile(file)
    response.writeHead(200, { 'content-type': contentTypes[path.extname(file)] || 'application/octet-stream' })
    response.end(body)
  } catch {
    const body = await readFile(path.join(distDir, 'index.html'))
    response.writeHead(200, { 'content-type': contentTypes['.html'] })
    response.end(body)
  }
}

function replaceLocalOrigins(html, port) {
  const localOrigins = [
    `http://ao.localhost:${port}`,
    `http://pt.localhost:${port}`,
    `http://localhost:${port}`,
  ]
  let portable = html
  for (const origin of localOrigins) {
    // Vite injects lazy module-preload links at runtime and Chromium
    // serializes their hrefs as absolute URLs. Keep deploy assets portable
    // across local QA, Vercel previews and both custom production hosts.
    portable = portable.replaceAll(`${origin}/assets/`, '/assets/')
    portable = portable.replaceAll(`${origin}/favicon.png`, '/favicon.png')
  }
  return portable
    .replaceAll(`http://ao.localhost:${port}`, 'https://ao.usemewithstyle.shop')
    .replaceAll(`http://pt.localhost:${port}`, 'https://pt.usemewithstyle.shop')
    .replaceAll(`http://localhost:${port}`, 'https://usemewithstyle.shop')
}

async function createCaptureContext(browser) {
  const context = await browser.newContext({ colorScheme: 'light', locale: 'pt-PT' })
  await context.addInitScript(() => {
    // The init script also runs in Chromium's transient about:blank document,
    // where localStorage is intentionally unavailable. It runs again with
    // normal storage access as soon as each market URL is loaded.
    try {
      localStorage.setItem('ump-lang-pref', 'pt')
      localStorage.setItem('ump-theme-pref', 'light')
      localStorage.setItem('use-me-analytics-consent-v1', 'rejected')
    } catch {
      // No-op for originless documents.
    }
  })
  await context.route(/\.(?:avif|gif|jpe?g|png|svg|webp)(?:\?.*)?$/i, (request) => request.abort())
  return context
}

async function captureRoute(context, port, market, route) {
  const config = MARKETS[market]
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    // Image requests are intentionally aborted above: their URLs are already
    // present in the captured DOM, while downloading every catalogue photo
    // for every route would make builds needlessly slow. Chromium logs those
    // aborts as ERR_FAILED; every other console error remains build-fatal.
    if (message.type() === 'error' && message.text() !== 'Failed to load resource: net::ERR_FAILED') {
      pageErrors.push(`console: ${message.text()}`)
    }
  })

  try {
    const localUrl = `http://${config.code}.localhost:${port}${route}`
    const response = await page.goto(localUrl, { waitUntil: 'networkidle', timeout: 60_000 })
    if (!response?.ok()) throw new Error(`${market} ${route} returned ${response?.status() ?? 'no response'} during prerender.`)
    await page.waitForFunction(() => document.querySelector('#root')?.children.length, undefined, { timeout: 15_000 })

    if (route.startsWith('/produto/')) {
      await page.waitForFunction(() => {
        const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
        return scripts.some((script) => script.textContent?.includes('"@type":"Product"'))
      }, undefined, { timeout: 30_000 })
    }
    if (route === '/catalogo') {
      await page.waitForFunction(() => document.querySelectorAll('a[href^="/produto/"]').length > 0, undefined, { timeout: 30_000 })
    }

    if (pageErrors.length > 0) throw new Error(`${market} ${route} browser errors:\n${pageErrors.join('\n')}`)
    await page.evaluate(({ marketName, stamp }) => {
      const root = document.getElementById('root')
      if (!root) throw new Error('Missing #root')
      root.dataset.prerendered = 'true'
      const marker = document.createElement('meta')
      marker.name = 'ump-prerender'
      marker.content = `market=${marketName}; generated=${stamp}`
      document.head.appendChild(marker)
    }, { marketName: market, stamp: generatedAt })

    const title = await page.title()
    const html = replaceLocalOrigins(await page.content(), port)
    return { html, title, url: productionUrl(market, route) }
  } finally {
    await page.close()
  }
}

if (!useServerlessChromium) await ensureBrowser()

const discovered = {}
for (const market of Object.keys(MARKETS)) {
  const [products, looks] = await Promise.all([discoverProductRoutes(market), discoverInstagramRoutes(market)])
  discovered[market] = uniqueRoutes([...STATIC_PRERENDER_ROUTES, ...products, ...looks])
}

const server = createServer((request, response) => {
  serveStatic(request, response).catch((error) => {
    console.error(error)
    if (!response.headersSent) response.writeHead(502)
    response.end('Prerender server error.')
  })
})
await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(0, '0.0.0.0', resolve)
})
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Could not determine prerender server port.')

// Vercel's build image does not ship the shared libraries needed by
// Playwright's downloaded browser. Sparticuz packages a Linux headless
// Chromium with its runtime dependencies; local builds keep using the exact
// Playwright-pinned browser installed on the developer machine.
const browser = await playwrightChromium.launch({
  headless: true,
  args: useServerlessChromium ? serverlessChromium.args : ['--no-sandbox'],
  executablePath: useServerlessChromium ? await serverlessChromium.executablePath() : undefined,
})
const manifest = { generatedAt, cmsOrigin, markets: {} }
// Sparticuz uses Chromium's single-process mode on Vercel. Keep the one
// incognito context alive for the complete build: closing the final context
// can terminate that browser process. localStorage remains isolated because
// AO and PT use distinct origins, and every route still gets a fresh page.
const context = await createCaptureContext(browser)
try {
  for (const market of Object.keys(MARKETS)) {
    manifest.markets[market] = []
    for (const route of discovered[market]) {
      const captured = await captureRoute(context, address.port, market, route)
      const outputFile = outputFileForRoute(distDir, MARKETS[market].code, route)
      await mkdir(path.dirname(outputFile), { recursive: true })
      await writeFile(outputFile, captured.html)
      manifest.markets[market].push({
        route,
        title: captured.title,
        url: captured.url,
        file: path.relative(distDir, outputFile),
      })
      console.log(`Prerendered ${market} ${route}`)
    }
  }
} finally {
  await context.close().catch(() => {})
  await browser.close()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

await writeFile(path.join(distDir, 'prerender-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
const spaSource = path.join(distDir, 'index.html')
const spaHtml = await readFile(spaSource, 'utf8')
const notFoundHtml = spaHtml.replace(
  '</head>',
  '    <meta name="robots" content="noindex,follow" />\n  </head>',
)
if (notFoundHtml === spaHtml) throw new Error('Could not add robots noindex to the static 404 document.')
await writeFile(path.join(distDir, '404.html'), notFoundHtml)
// Vercel resolves physical files before applying rewrites. If index.html
// remained at the output root, a request for / could bypass the market-host
// rule and serve the generic SPA document. Keep that fallback under a
// non-route filename so AO/PT prerenders win at / as well as deeper paths.
await rename(spaSource, path.join(distDir, '__spa.html'))
console.log(`Prerendered ${Object.values(manifest.markets).flat().length} market-aware pages.`)
