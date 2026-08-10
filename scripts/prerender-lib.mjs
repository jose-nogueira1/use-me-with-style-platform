import path from 'node:path'

export const MARKETS = {
  AO: { code: 'ao', host: 'ao.usemewithstyle.shop', currency: 'AOA' },
  PT: { code: 'pt', host: 'pt.usemewithstyle.shop', currency: 'EUR' },
}

export const STATIC_PRERENDER_ROUTES = [
  '/',
  '/catalogo',
  '/ajuda',
  '/sobre',
  '/shop-instagram',
  '/politica-privacidade',
  '/termos-condicoes',
  '/eliminacao-de-dados',
]

export const SPA_ONLY_PREFIXES = [
  '/admin',
  '/carrinho',
  '/checkout',
  '/conta',
  '/encomenda-confirmada',
]

function normalizedPathname(route) {
  const url = new URL(route, 'https://usemewithstyle.shop')
  return url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')
}

function categoryRoute(route) {
  const url = new URL(route, 'https://usemewithstyle.shop')
  if (normalizedPathname(route) !== '/catalogo' || url.hash) return null
  const category = url.searchParams.get('cat')?.trim() ?? ''
  if (![...url.searchParams.keys()].every((key) => key === 'cat')) return null
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) ? `/catalogo?cat=${encodeURIComponent(category)}` : null
}

export function isRuntimeSpaRoute(route) {
  const pathname = normalizedPathname(route)
  return pathname === '/carrinho'
    || pathname === '/checkout'
    || pathname === '/conta'
    || /^\/encomenda-confirmada\/[^/]+$/.test(pathname)
    || pathname === '/admin'
    || pathname.startsWith('/admin/')
}

export function isPublicRouteShape(route) {
  const pathname = normalizedPathname(route)
  return Boolean(categoryRoute(route))
    || STATIC_PRERENDER_ROUTES.includes(pathname)
    || /^\/produto\/[^/]+$/.test(pathname)
    || /^\/shop-instagram\/[^/]+$/.test(pathname)
}

export function normalizePublicRoute(route) {
  const url = new URL(route, 'https://usemewithstyle.shop')
  const category = categoryRoute(route)
  if ((url.search || url.hash) && !category) throw new Error(`Prerender routes cannot contain unsupported query strings or hashes: ${route}`)
  const pathname = normalizedPathname(route)
  if (SPA_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    throw new Error(`Private/runtime-only route cannot be prerendered: ${pathname}`)
  }
  for (const segment of pathname.split('/')) {
    if (segment === '.' || segment === '..') throw new Error(`Unsafe prerender route: ${pathname}`)
  }
  return category || pathname
}

export function outputFileForRoute(distDir, marketCode, route) {
  const normalized = normalizePublicRoute(route)
  if (normalized.startsWith('/catalogo?cat=')) {
    const slug = new URL(normalized, 'https://usemewithstyle.shop').searchParams.get('cat')
    return path.join(distDir, '__prerender', marketCode, 'catalogo', 'category', slug, 'index.html')
  }
  const segments = normalized === '/' ? [] : normalized.slice(1).split('/')
  return path.join(distDir, '__prerender', marketCode, ...segments, 'index.html')
}

export function productionUrl(market, route) {
  const config = MARKETS[market]
  if (!config) throw new Error(`Unknown market: ${market}`)
  return `https://${config.host}${normalizePublicRoute(route)}`
}

export function uniqueRoutes(routes) {
  return [...new Set(routes.map(normalizePublicRoute))]
}
