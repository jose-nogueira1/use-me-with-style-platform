import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('admin global updates unwrap Payload response envelopes before updating form state', () => {
  const api = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
  assert.match(api, /request<\{ message: string; result: T \}>/);
  assert.match(api, /return data\.result/);
  assert.match(api, /adminUpdateGlobal\('\/globals\/home-hero\?depth=1', input\)/);
});
