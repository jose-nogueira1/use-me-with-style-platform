import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('admin media uploads retry only transient server and network failures', () => {
  const api = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
  assert.match(api, /transientStatuses = new Set\(\[500, 502, 503, 504\]\)/);
  assert.match(api, /const maxAttempts = 3/);
  assert.match(api, /400 \* 2 \*\* \(attempt - 1\)/);
  assert.match(api, /!transientStatuses\.has\(res\.status\)/);
});
