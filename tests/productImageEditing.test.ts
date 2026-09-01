import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('product editor exposes a replace-image action', () => {
  const source = readFileSync(new URL('../src/admin/pages/ProductEditor.tsx', import.meta.url), 'utf8')
  assert.match(source, /replaceImageIndex/)
  assert.match(source, /Replace image|Substituir imagem/)
  assert.match(source, /adminUploadProductImage/)
})
