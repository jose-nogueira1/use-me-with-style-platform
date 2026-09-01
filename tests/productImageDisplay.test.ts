import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('all product image surfaces preserve the uploaded 3:4 crop', () => {
  const card = readFileSync(new URL('../src/storefront/components/ProductCard.tsx', import.meta.url), 'utf8')
  const detail = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8')
  const adminList = readFileSync(new URL('../src/admin/pages/Products.tsx', import.meta.url), 'utf8')
  const editor = readFileSync(new URL('../src/admin/pages/ProductEditor.tsx', import.meta.url), 'utf8')

  assert.match(card, /aspectRatio: '3 \/ 4'/)
  assert.match(detail, /aspectRatio: '3 \/ 4'/)
  assert.match(adminList, /aspectRatio: '3 \/ 4'/)
  assert.match(editor, /aspectRatio: '3 \/ 4'/)
})
