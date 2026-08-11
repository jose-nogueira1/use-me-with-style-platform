import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('mobile bottom navigation follows the iOS visual viewport and safe area', () => {
  const layout = readFileSync(new URL('../src/storefront/StorefrontLayout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /window\.visualViewport/);
  assert.match(layout, /viewport\.offsetTop \+ viewport\.height/);
  assert.match(layout, /window\.innerHeight - visibleBottom/);
  assert.match(layout, /env\(safe-area-inset-bottom\)/);
  assert.match(layout, /transform: 'translateZ\(0\)'/);
});
