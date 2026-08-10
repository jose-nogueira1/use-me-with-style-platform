import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApiCategory } from '../src/lib/api.ts';
import { getSingleCategoryIntro } from '../src/lib/categoryIntro.ts';

const categories: ApiCategory[] = [
  {
    id: 1,
    namePT: 'Vestidos',
    nameEN: 'Dresses',
    slug: 'vestidos',
    introPT: 'Vestidos confortáveis para todos os dias.',
    introEN: 'Comfortable dresses for every day.',
  },
  {
    id: 2,
    namePT: 'Tops',
    nameEN: 'Tops',
    slug: 'tops',
    introPT: 'Tops para treinar.',
  },
];

test('returns localized copy for exactly one active CMS category', () => {
  assert.deepEqual(getSingleCategoryIntro(categories, ['vestidos'], 'en'), {
    title: 'Dresses',
    body: 'Comfortable dresses for every day.',
  });
});

test('falls back to Portuguese copy when the English introduction is empty', () => {
  assert.deepEqual(getSingleCategoryIntro(categories, ['tops'], 'en'), {
    title: 'Tops',
    body: 'Tops para treinar.',
  });
});

test('does not invent one landing-page introduction for all or multiple categories', () => {
  assert.equal(getSingleCategoryIntro(categories, [], 'pt'), null);
  assert.equal(getSingleCategoryIntro(categories, ['vestidos', 'tops'], 'pt'), null);
  assert.equal(getSingleCategoryIntro(categories, ['new'], 'pt'), null);
});
