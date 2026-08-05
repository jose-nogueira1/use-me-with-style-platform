import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const inboxSource = readFileSync(new URL('../src/admin/pages/Mensagens.tsx', import.meta.url), 'utf8');

test('the storefront admin fetches only Instagram messages', () => {
  assert.match(apiSource, /where\[channel\]\[equals\]=instagram/);
  assert.doesNotMatch(inboxSource, /channel:\s*selected\.channel/);
  assert.match(inboxSource, /Instagram-only Phase 1 inbox/);
});

test('the Instagram inbox renders rich media with an expiry-safe fallback and post link', () => {
  assert.match(inboxSource, /instagramContextPermalink/);
  assert.match(inboxSource, /setPreviewAttempt\(showVideo \? 'failed' : 'video'\)/);
  assert.match(inboxSource, /Preview unavailable/);
  assert.match(inboxSource, /Open post on Instagram/);
  assert.match(inboxSource, /'image', 'photo', 'video'|story_video/);
});
