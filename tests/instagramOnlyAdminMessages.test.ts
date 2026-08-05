import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const inboxSource = readFileSync(new URL('../src/admin/pages/Mensagens.tsx', import.meta.url), 'utf8');

test('the storefront admin fetches only Instagram messages', () => {
  assert.match(apiSource, /where\[channel\]\[equals\]=instagram/);
  assert.doesNotMatch(inboxSource, /channel:\s*selected\.channel/);
  assert.match(apiSource, /adminMarkInstagramConversationRead/);
});

test('the Instagram inbox renders rich media with an expiry-safe fallback and post link', () => {
  assert.match(inboxSource, /instagramContextPermalink/);
  assert.match(inboxSource, /setAttempt\(video \? 'failed' : 'video'\)/);
  assert.match(inboxSource, /Preview unavailable/);
  assert.match(inboxSource, /instagramContextPermalink/);
  assert.match(inboxSource, /story_video/);
});

test('outbound echoes composed in Instagram are labelled in the admin conversation', () => {
  assert.match(inboxSource, /instagram-app -- synced outbound echo/);
  assert.match(inboxSource, /Sent from Instagram/);
  assert.match(inboxSource, /Enviada pelo Instagram/);
});

test('inline replies quote and navigate to their original message without pretending the API can compose them', () => {
  assert.match(inboxSource, /Replying to your message/);
  assert.match(inboxSource, /Replying to customer/);
  assert.match(inboxSource, /Original message unavailable/);
  assert.match(inboxSource, /scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
  assert.match(inboxSource, /highlightedMessageId === message\.id/);
  assert.match(inboxSource, /instagramContextType === 'inline_reply'/);
  assert.match(inboxSource, /https:\/\/www\.instagram\.com\/direct\/inbox\//);
});

test('the inbox separates unread state from workflow and keeps drafts per conversation', () => {
  assert.match(inboxSource, /adminReadAt/);
  assert.match(inboxSource, /unreadCount/);
  assert.match(inboxSource, /needs_reply/);
  assert.match(inboxSource, /waiting/);
  assert.match(inboxSource, /priority/);
  assert.match(inboxSource, /done/);
  assert.match(inboxSource, /drafts\[selected\.key\]/);
});

test('customer context never guesses market from profile or language', () => {
  assert.match(inboxSource, /Not established yet/);
  assert.match(inboxSource, /Never inferred from profile or language/);
  assert.match(inboxSource, /Confirmed by the linked order/);
});

test('message groups hide internal automation text and show customer seen receipts', () => {
  assert.doesNotMatch(inboxSource, /messageSourceLabel/);
  assert.match(inboxSource, /instagramSeenAt/);
  assert.match(inboxSource, /Seen/);
  assert.match(inboxSource, /groupEnd/);
});
