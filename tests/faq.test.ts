import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildFaqEntries, buildFaqStructuredData } from '../src/lib/faqContent.ts';

test('FAQ content is market-aware and does not claim deferred Portugal payments are live', () => {
  const ao = buildFaqEntries('AO', 'pt', {
    angolaPaymentLive: false,
    angolaPaymentMethods: ['multicaixa_express'],
  } as never);
  const pt = buildFaqEntries('PT', 'pt', {
    portugalPaymentsEnabled: false,
    portugalPaymentMethods: ['stripe', 'paypal', 'mbway'],
    portugalFreeShippingThreshold: 75,
  } as never);

  assert.ok(ao.some((entry) => /16 municípios de Luanda/.test(entry.answer)));
  assert.ok(ao.some((entry) => /pagamento pendente/.test(entry.answer) && /WhatsApp/.test(entry.answer)));
  assert.ok(pt.some((entry) => /pagamento pendente/.test(entry.answer) && /WhatsApp/.test(entry.answer)));
  assert.ok(pt.every((entry) => !/coordenado por email|Stripe, PayPal ou MB WAY/.test(entry.answer)));
  assert.ok(pt.some((entry) => entry.link?.to === '/ajuda#devolucoes'));
  assert.ok(pt.some((entry) => entry.link?.to === '/guia-de-tamanhos'));
});

test('CMS-authored payment FAQs follow current market enablement', () => {
  const content = {
    faqEntries: [{
      enabled: true,
      questionPT: 'Que métodos de pagamento aceitam?',
      questionEN: 'Which payment methods do you accept?',
      answerPT: 'Pagamento por AppyPay.',
      answerEN: 'Pay with AppyPay.',
      answerPTPT: 'Pagamento coordenado por email.',
      answerENPT: 'Payment coordinated by email.',
    }],
  } as never;
  const settings = { portugalPaymentsEnabled: false, portugalPaymentMethods: ['stripe', 'paypal'] } as never;
  const entry = buildFaqEntries('PT', 'en', settings, content)[0];
  assert.match(entry.answer, /payment pending/);
  assert.match(entry.answer, /WhatsApp/);
  assert.doesNotMatch(entry.answer, /email|Stripe|PayPal/);
});

test('Angola return guidance consistently gives customers 14 days in Portuguese and English', () => {
  for (const lang of ['pt', 'en'] as const) {
    const entry = buildFaqEntries('AO', lang, null).find((candidate) => candidate.link?.to === '/ajuda#devolucoes');
    assert.ok(entry);
    assert.match(entry.answer, /14 (?:dias|days)/i);
    assert.doesNotMatch(entry.answer, /48 (?:horas|hours)/i);
  }

  for (const path of [
    'src/theme/i18n.ts',
    'src/storefront/components/Footer.tsx',
    'src/storefront/pages/ProductDetail.tsx',
  ]) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /fortyEightHours|48 (?:horas|hours)|48h exchange/i, `${path} contains conflicting Angola returns copy`);
  }
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

test('FAQ page uses the shared accessible disclosure and emits dedicated JSON-LD', () => {
  const source = readFileSync(new URL('../src/storefront/pages/Faq.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const footer = readFileSync(new URL('../src/storefront/components/Footer.tsx', import.meta.url), 'utf8');
  const help = readFileSync(new URL('../src/storefront/pages/Help.tsx', import.meta.url), 'utf8');
  assert.match(source, /<Disclosure/);
  assert.match(source, /openEntries/);
  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /buildFaqStructuredData\(entries\)/);
  assert.match(app, /path="perguntas-frequentes" element={<Faq \/>}/);
  assert.match(footer, /to: '\/perguntas-frequentes'/);
  assert.match(help, /id="devolucoes"\s+heading={t\('returnsPolicyHeading'/);
});
