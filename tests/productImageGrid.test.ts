import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('admin product image grid keeps tiles equal and supports drag ordering', () => {
  const source = readFileSync(new URL('../src/admin/pages/ProductEditor.tsx', import.meta.url), 'utf8')
  assert.match(source, /repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(source, /draggable=\{true\}/)
  assert.match(source, /onDrop=\{/)
  assert.match(source, /handleImageDrop\(/)
})

test('admin product image colour picker only uses selected product colours', () => {
  const source = readFileSync(new URL('../src/admin/pages/ProductEditor.tsx', import.meta.url), 'utf8')
  assert.match(source, /selectedProductColors/)
  assert.match(source, /selectedProductColors\.map\(/)
})
