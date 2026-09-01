import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('prerender only requires product cards on the unfiltered catalogue route', () => {
  const source = readFileSync(new URL('../scripts/prerender.mjs', import.meta.url), 'utf8')
  assert.match(source, /if \(route === '\/catalogo'\)/)
})
