import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildFaqEntries, buildFaqStructuredData } from '../src/lib/faqContent.ts';

test('FAQ content is market-aware and does not claim deferred Portugal payments are live', () => {
  const ao = buildFaqEntries('AO', 'pt', null);
  const pt = buildFaqEntries('PT', 'pt', {
    portugalPaymentsEnabled: false,
    portugalPaymentMethods: ['stripe', 'paypal', 'mbway'],
    portugalFreeShippingThreshold: 75,
  } as never);

  assert.ok(ao.some((entry) => /16 municípios de Luanda/.test(entry.answer)));
  assert.ok(ao.some((entry) => /Multicaixa Express/.test(entry.answer)));
  assert.ok(pt.some((entry) => /atualmente coordenado por email/.test(entry.answer)));
  assert.ok(pt.some((entry) => /Stripe, PayPal ou MB WAY/.test(entry.answer)));
  assert.ok(pt.some((entry) => entry.link?.to === '/ajuda#devolucoes'));
  assert.ok(pt.some((entry) => entry.link?.to === '/guia-de-tamanhos'));
});

test('FAQPage structured data mirrors every visible question and answer', () => {
  const entries = buildFaqEntries('PT', 'en', null);
  const schema = buildFaqStructuredData(entries);
  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(schema.mainEntity.length, entries.length);
  assert.deepEqual(schema.mainEntity[0], {
    '@type': 'Question',
    name: entries[0].question,
    acceptedAnswer: { '@type': 'Answer', text: entries[0].answer },
  });
});

test('FAQ page uses native accessible accordions and emits dedicated JSON-LD', () => {
  const source = readFileSync(new URL('../src/storefront/pages/Faq.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const footer = readFileSync(new URL('../src/storefront/components/Footer.tsx', import.meta.url), 'utf8');
  const help = readFileSync(new URL('../src/storefront/pages/Help.tsx', import.meta.url), 'utf8');
  assert.match(source, /<details/);
  assert.match(source, /<summary/);
  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /buildFaqStructuredData\(entries\)/);
  assert.match(app, /path="perguntas-frequentes" element={<Faq \/>}/);
  assert.match(footer, /to: '\/perguntas-frequentes'/);
  assert.match(help, /id="devolucoes"\s+heading={t\('returnsPolicyHeading'/);
});
