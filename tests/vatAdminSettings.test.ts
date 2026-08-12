import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/admin/pages/Settings.tsx', import.meta.url), 'utf8');

test('storefront admin edits every VAT rate used by the CMS and has no obsolete flat Portugal field', () => {
  for (const field of [
    'vatRateAO',
    'vatRatePortugalMainland',
    'vatRatePortugalMadeira',
    'vatRatePortugalAzores',
  ]) {
    assert.match(apiSource, new RegExp(`\\b${field}: number`));
    assert.match(settingsSource, new RegExp(`\\b${field}:`));
    assert.match(settingsSource, new RegExp(`set\\('${field}'`));
  }

  assert.doesNotMatch(apiSource, /\bvatRatePT\b/);
  assert.doesNotMatch(settingsSource, /\bvatRatePT\b/);
});
