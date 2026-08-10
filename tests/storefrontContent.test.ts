import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildFaqEntries } from '../src/lib/faqContent.ts';
import { DEFAULT_STOREFRONT_CONTENT, normalizeStorefrontContent } from '../src/lib/storefrontContent.ts';

const projectFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('storefront content falls back field-by-field without discarding saved copy', () => {
  const content = normalizeStorefrontContent({ faqTitlePT: 'Ajuda rápida', faqIntroPT: '   ' });
  assert.equal(content.faqTitlePT, 'Ajuda rápida');
  assert.equal(content.faqIntroPT, DEFAULT_STOREFRONT_CONTENT.faqIntroPT);
  assert.deepEqual(content.faqEntries, []);
});

test('CMS FAQ order, visibility, market overrides and safe internal links drive the storefront', () => {
  const content = {
    faqEntries: [
      { enabled: false, questionPT: 'Hidden', questionEN: 'Hidden', answerPT: 'No', answerEN: 'No' },
      { enabled: true, questionPT: 'Primeira?', questionEN: 'First?', answerPT: 'AO base', answerEN: 'AO base EN', answerPTPT: 'Resposta PT', answerENPT: 'PT answer', linkPath: '/ajuda', linkLabelPT: 'Ajuda', linkLabelEN: 'Help' },
      { enabled: true, questionPT: 'Segunda?', questionEN: 'Second?', answerPT: 'Segunda resposta', answerEN: 'Second answer', linkPath: 'javascript:alert(1)', linkLabelPT: 'Bad', linkLabelEN: 'Bad' },
    ],
  };
  const pt = buildFaqEntries('PT', 'pt', null, content);
  assert.deepEqual(pt.map((entry) => entry.question), ['Primeira?', 'Segunda?']);
  assert.equal(pt[0].answer, 'Resposta PT');
  assert.deepEqual(pt[0].link, { to: '/ajuda', label: 'Ajuda' });
  assert.equal(pt[1].link, undefined);
  assert.equal(buildFaqEntries('AO', 'en', null, content)[0].answer, 'AO base EN');
});

test('custom admin exposes a top-level bilingual content editor backed by Payload', () => {
  const routes = projectFile('src/admin/AdminRoutes.tsx');
  const layout = projectFile('src/admin/AdminLayout.tsx');
  const editor = projectFile('src/admin/pages/Content.tsx');
  const faq = projectFile('src/storefront/pages/Faq.tsx');
  const sizeGuide = projectFile('src/storefront/pages/SizeGuide.tsx');
  assert.match(routes, /path="conteudo" element={<Content \/>}/);
  assert.match(layout, /to: '\/admin\/conteudo'/);
  assert.match(editor, /adminUpdateStorefrontContent\(content\)/);
  assert.match(editor, /contentAnswerPortugal/);
  assert.match(faq, /fetchStorefrontContent\(\)/);
  assert.match(sizeGuide, /fetchStorefrontContent\(\)/);
});
