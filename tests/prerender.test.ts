import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  STATIC_PRERENDER_ROUTES,
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
    rewrites: Array<{ source: string; destination: string; has?: Array<{ type: string; value: string }> }>;
  };
  const source = JSON.stringify(config);
  assert.match(source, /ao\.usemewithstyle\.shop/);
  assert.match(source, /pt\.usemewithstyle\.shop/);
  assert.ok(config.rewrites.some((rule) => rule.destination === '/__prerender/ao/produto/:slug/index.html'));
  assert.ok(config.rewrites.some((rule) => rule.destination === '/__prerender/pt/produto/:slug/index.html'));
  assert.deepEqual(config.rewrites.at(-1), { source: '/(.*)', destination: '/__spa.html' });
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
});
