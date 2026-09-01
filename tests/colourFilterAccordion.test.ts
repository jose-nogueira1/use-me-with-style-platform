import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('storefront colour filters collapse to five rows with an accessible toggle', () => {
  const source = readFileSync(new URL('../src/storefront/pages/Browse.tsx', import.meta.url), 'utf8')
  assert.match(source, /FilterGroup label=\{t\('colour', lang\)\}[\s\S]*collapsible/)
  assert.match(source, /maxHeight: canCollapse && !expanded \? 174 : undefined/)
  assert.match(source, /Show more|Mostrar mais/)
})
