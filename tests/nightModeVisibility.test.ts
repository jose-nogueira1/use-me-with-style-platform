import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { DARK_VARS } from '../src/theme/tokens.ts';

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [];
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string) {
  const bright = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (bright + 0.05) / (dark + 0.05);
}

test('dark storefront panels retain visible boundaries and readable secondary copy', () => {
  assert.ok(contrast(DARK_VARS['--c-surface-border'], DARK_VARS['--c-paper']) >= 3);
  assert.ok(contrast(DARK_VARS['--c-ink-soft'], DARK_VARS['--c-subtle-bg']) >= 4.5);
});

test('sale ribbon text clears AA across both gradient endpoints', () => {
  assert.ok(contrast('#FFFDF8', '#B95545') >= 4.5);
  assert.ok(contrast('#FFFDF8', '#A6483A') >= 4.5);
});

test('night-mode placeholders and the size-guide portal keep explicit theme styling', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const product = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');

  assert.match(app, /textarea::placeholder \{ color: \$\{C\.inkSoft\}; opacity: 1; \}/);
  assert.match(app, /\.ump-theme-scope\[data-theme='dark'\]/);
  assert.match(product, /className="ump-theme-scope" data-theme=\{themeMode\}/);
});
