import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  STATIC_PRERENDER_ROUTES,
  isPublicRouteShape,
  isRuntimeSpaRoute,
  normalizePublicRoute,
  outputFileForRoute,
  productionUrl,
  uniqueRoutes,
} from '../scripts/prerender-lib.mjs';

const projectFile = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('prerender output is isolated by market and clean route', () => {
  assert.equal(
    outputFileForRoute('/tmp/dist', 'ao', '/produto/vestido-move'),
    path.join('/tmp/dist', '__prerender', 'ao', 'produto', 'vestido-move', 'index.html'),
  );
  assert.equal(productionUrl('PT', '/catalogo/'), 'https://pt.usemewithstyle.shop/catalogo');
  assert.deepEqual(uniqueRoutes(['/', '/catalogo', '/catalogo/']), ['/', '/catalogo']);
});

test('private and stateful routes cannot enter the prerender manifest', () => {
  for (const route of ['/admin', '/checkout', '/carrinho', '/conta', '/encomenda-confirmada/UMP-1']) {
    assert.throws(() => normalizePublicRoute(route), /cannot be prerendered/);
  }
  assert.throws(() => normalizePublicRoute('/catalogo?cat=leggings'), /query strings/);
});

test('Vercel selects AO and PT documents by host before preserving the SPA fallback', () => {
  const config = JSON.parse(projectFile('vercel.json')) as {
    rewrites: Array<{
      source: string;
      destination: string;
      has?: Array<{ type: string; value: string }>;
      missing?: Array<{ type: string; value: string }>;
    }>;
  };
  const source = JSON.stringify(config);
  assert.match(source, /ao\.usemewithstyle\.shop/);
  assert.match(source, /pt\.usemewithstyle\.shop/);
  assert.ok(config.rewrites.some((rule) => rule.destination === '/__prerender/ao/produto/:slug/index.html'));
  assert.ok(config.rewrites.some((rule) => rule.destination === '/__prerender/pt/produto/:slug/index.html'));
  assert.equal(config.rewrites.some((rule) => rule.source === '/(.*)'), false);
  assert.ok(config.rewrites.some((rule) => rule.source === '/:page(carrinho|checkout|conta)' && rule.destination === '/__spa.html'));
  const nonMarketProduct = config.rewrites.find((rule) => rule.source === '/produto/:slug' && rule.missing);
  assert.deepEqual(nonMarketProduct?.missing?.map((condition) => condition.value), [
    'ao.usemewithstyle.shop',
    'pt.usemewithstyle.shop',
  ]);
});

test('route allowlists distinguish public, runtime-only and genuinely invalid URLs', () => {
  for (const route of ['/', '/catalogo', '/produto/vestido-move', '/shop-instagram/look-1']) {
    assert.equal(isPublicRouteShape(route), true, route);
  }
  for (const route of ['/carrinho', '/checkout', '/conta', '/encomenda-confirmada/UMP-1', '/admin/login']) {
    assert.equal(isRuntimeSpaRoute(route), true, route);
  }
  for (const route of ['/nao-existe', '/produto', '/produto/a/extra', '/encomenda-confirmada']) {
    assert.equal(isPublicRouteShape(route) || isRuntimeSpaRoute(route), false, route);
  }
});

test('all configured static routes are public and the SPA clears captured markup before mounting', () => {
  for (const route of STATIC_PRERENDER_ROUTES) assert.equal(normalizePublicRoute(route), route);
  const entry = projectFile('src/main.tsx');
  assert.match(entry, /root\.dataset\.prerendered === 'true'/);
  assert.match(entry, /root\.replaceChildren\(\)/);
  assert.match(entry, /createRoot\(root\)\.render/);
});

test('production builds force the same-origin API and use a Vercel-compatible browser', () => {
  const packageJson = JSON.parse(projectFile('package.json')) as { scripts: Record<string, string> };
  assert.match(packageJson.scripts.build, /^VITE_API_BASE_URL=\/ vite build/);

  const prerender = projectFile('scripts/prerender.mjs');
  assert.match(prerender, /process\.env\.VERCEL === '1'/);
  assert.match(prerender, /serverlessChromium\.executablePath\(\)/);
  assert.match(prerender, /404\.html/);
  assert.match(prerender, /pathname\.startsWith\('\/api\/media\/file\/'\) \? route\.continue\(\) : route\.abort\(\)/);

  const verifier = projectFile('scripts/verify-prerender.mjs');
  assert.match(verifier, /contains a product image with empty alt text/);
  assert.match(verifier, /omits its crawlable product image or alt text/);
});
