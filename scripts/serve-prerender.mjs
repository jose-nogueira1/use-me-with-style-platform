import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isPublicRouteShape, isRuntimeSpaRoute, outputFileForRoute } from './prerender-lib.mjs'

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(projectDir, 'dist')
const cmsOrigin = (process.env.PRERENDER_CMS_ORIGIN || 'https://use-me-with-style-cms-production.up.railway.app').replace(/\/$/, '')
const port = Number(process.env.PORT) || 4173

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

async function sendFile(response, file, status = 200) {
  const body = await readFile(file)
  response.writeHead(status, { 'content-type': contentTypes[path.extname(file)] || 'application/octet-stream' })
  response.end(body)
}

async function handler(request, response) {
  const url = new URL(request.url, 'http://localhost')
  if (url.pathname.startsWith('/api/')) {
    const upstream = await fetch(`${cmsOrigin}${url.pathname}${url.search}`, { headers: { accept: request.headers.accept || '*/*' } })
    response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/octet-stream' })
    response.end(Buffer.from(await upstream.arrayBuffer()))
    return
  }

  const hostname = (request.headers.host || '').split(':')[0]
  const marketCode = hostname.split('.')[0] === 'pt' ? 'pt' : hostname.split('.')[0] === 'ao' ? 'ao' : null

  const requested = url.pathname === '/' ? null : url.pathname
  if (requested) {
    const resolved = path.resolve(distDir, `.${decodeURIComponent(requested)}`)
    if (resolved.startsWith(`${distDir}${path.sep}`)) {
      try {
        if ((await stat(resolved)).isFile()) return sendFile(response, resolved)
      } catch {
        // Continue into route-aware HTML handling.
      }
    }
  }

  if (marketCode) {
    try {
      const prerendered = outputFileForRoute(distDir, marketCode, url.pathname)
      if ((await stat(prerendered)).isFile()) return sendFile(response, prerendered)
    } catch {
      // Not a generated public route.
    }
    if (isRuntimeSpaRoute(url.pathname)) return sendFile(response, path.join(distDir, '__spa.html'))
    return sendFile(response, path.join(distDir, '404.html'), 404)
  }

  if (isPublicRouteShape(url.pathname) || isRuntimeSpaRoute(url.pathname)) {
    return sendFile(response, path.join(distDir, '__spa.html'))
  }
  return sendFile(response, path.join(distDir, '404.html'), 404)
}

const server = createServer((request, response) => {
  handler(request, response).catch((error) => {
    console.error(error)
    if (!response.headersSent) response.writeHead(502)
    response.end('Preview server error.')
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Production-like prerender preview: http://ao.localhost:${port} and http://pt.localhost:${port}`)
})
