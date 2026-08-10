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

export function normalizePublicRoute(route) {
  const url = new URL(route, 'https://usemewithstyle.shop')
  if (url.search || url.hash) throw new Error(`Prerender routes cannot contain query strings or hashes: ${route}`)
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')
  if (SPA_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    throw new Error(`Private/runtime-only route cannot be prerendered: ${pathname}`)
  }
  for (const segment of pathname.split('/')) {
    if (segment === '.' || segment === '..') throw new Error(`Unsafe prerender route: ${pathname}`)
  }
  return pathname
}

export function outputFileForRoute(distDir, marketCode, route) {
  const normalized = normalizePublicRoute(route)
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
