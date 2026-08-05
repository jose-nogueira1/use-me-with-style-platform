import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const inboxSource = readFileSync(new URL('../src/admin/pages/Mensagens.tsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/admin/pages/Settings.tsx', import.meta.url), 'utf8');

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
  assert.match(inboxSource, /useState<InboxFilter>\('all'\)/);
  assert.match(inboxSource, /All conversations/);
});

test('customer context never guesses market from profile or language', () => {
  assert.match(inboxSource, /Not established yet/);
  assert.match(inboxSource, /Never inferred from profile or language/);
  assert.match(inboxSource, /Confirmed by the linked order/);
  assert.match(inboxSource, /Boolean\(value\) && typeof value === 'object'/);
});

test('message groups hide internal automation text and show customer seen receipts', () => {
  assert.doesNotMatch(inboxSource, /messageSourceLabel/);
  assert.match(inboxSource, /instagramSeenAt/);
  assert.match(inboxSource, /Seen/);
  assert.match(inboxSource, /groupEnd/);
});

test('the conversation action menu exposes working secondary actions', () => {
  assert.match(inboxSource, /aria-expanded=\{menuOpen\}/);
  assert.match(inboxSource, /role="menu"/);
  assert.match(inboxSource, /View customer context/);
  assert.match(inboxSource, /Mark as needs reply/);
  assert.match(inboxSource, /Open in Instagram/);
});

test('approval-mode AI drafts stay human-controlled in the Instagram inbox', () => {
  assert.match(apiSource, /adminUpdateAiDraft/);
  assert.match(inboxSource, /aiDraftStatus === 'draft_ready'/);
  assert.match(inboxSource, /Assistant suggestion/);
  assert.match(inboxSource, /Approve and send/);
  assert.match(inboxSource, /Regenerate/);
  assert.match(inboxSource, /aiProcessingStatus: 'queued'/);
  assert.match(inboxSource, /aiAvailableAt: new Date\(\)\.toISOString\(\)/);
  assert.match(inboxSource, /Dismiss/);
  assert.match(inboxSource, /Pause bot/);
});

test('AI suggestions can be edited and expose verified facts, model, cost and operating mode', () => {
  assert.match(inboxSource, /Edit suggestion/);
  assert.match(inboxSource, /human_edited_sent/);
  assert.match(inboxSource, /View facts and audit/);
  assert.match(inboxSource, /aiEstimatedCostUsd/);
  assert.match(inboxSource, /Manual approval/);
  assert.match(apiSource, /adminGetAiAssistantStatus/);
});

test('AI messaging settings expose guarded approval and hybrid controls without enabling hybrid by default', () => {
  assert.match(apiSource, /adminFetchAiMessagingSettings/);
  assert.match(apiSource, /adminUpdateAiMessagingSettings/);
  assert.match(settingsSource, /operatingMode: 'approval'/);
  assert.match(settingsSource, /Emergency stop/);
  assert.match(settingsSource, /Minimum confidence/);
  assert.match(settingsSource, /Automatic replies per conversation \/ 24h/);
  assert.match(settingsSource, /autoReplyMarketClarification/);
  assert.match(settingsSource, /autoReplyProductClarification/);
  assert.match(settingsSource, /hybridConfirmed/);
  assert.match(inboxSource, /aiAutomationDecision/);
  assert.match(inboxSource, /Sent automatically by AI/);
});
