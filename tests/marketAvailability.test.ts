import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/lib/productAdapters.ts', import.meta.url), 'utf8')

test('market stock status is calculated independently for each market', () => {
  assert.match(source, /marketStockStatus\(/)
  assert.match(source, /market === 'AO' \? variant\.stockAO : variant\.stockPT/)
  assert.match(source, /status: !visible \? 'hidden' : stock === 0 \? 'sold_out' : stock <= 3 \? 'low_stock' : 'in_stock'/)
})

test('market stock status distinguishes hidden markets from sold-out markets', () => {
  assert.match(source, /availableAO !== false/)
  assert.match(source, /availablePT !== false/)
  assert.match(source, /'hidden'/)
})
