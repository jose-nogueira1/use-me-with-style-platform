import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('storefront colour filters use a three-line desktop accordion and horizontal mobile chip track', () => {
  const source = readFileSync(new URL('../src/storefront/pages/Browse.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(source, /FilterGroup[^\n]*label=\{t\('colour', lang\)\}[^\n]*collapsibleDesktop/)
  assert.match(source, /ump-filter-options/)
  assert.match(styles, /\.ump-filter-options\s*\{[\s\S]*overflow-x: auto/)
})
