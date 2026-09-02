import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/lib/productAdapters.ts', import.meta.url), 'utf8')
const cardSource = readFileSync(new URL('../src/storefront/components/ProductCard.tsx', import.meta.url), 'utf8')
const layoutSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

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

test('only sold-out cards are dimmed and struck across the card', () => {
  assert.match(cardSource, /position: 'relative'/)
  assert.match(cardSource, /position: 'absolute'/)
  assert.match(cardSource, /top: 0/)
  assert.match(cardSource, /right: 0/)
  assert.match(cardSource, /opacity: product\.marketStatus === 'sold_out' \? 0\.55 : 1/)
  assert.match(cardSource, /product\.marketStatus === 'sold_out' && \(/)
  assert.match(cardSource, /width: '166\.7%'/)
  assert.match(cardSource, /background: C\.dangerStrong/)
})

test('catalogue and homepage product grids use the enlarged card scale', () => {
  assert.match(layoutSource, /\.ump-grid-auto \{ display: grid; grid-template-columns: repeat\(auto-fill, minmax\(min\(215\.625px, 100%\), 1fr\)\)/)
  assert.match(layoutSource, /@media \(min-width: 1800px\) \{ \.ump-grid-auto \{ grid-template-columns: repeat\(auto-fill, minmax\(min\(273\.125px, 100%\), 1fr\)\)/)
  assert.match(cardSource, /homepage \? 215\.625 : 187\.5/)
})

test('homepage cards get a further 15 percent size increase and the strike spans the image corners', () => {
  assert.match(cardSource, /homepage\?: boolean/)
  assert.match(cardSource, /width: isSmall \? \(homepage \? 215\.625 : 187\.5\) : undefined/)
  assert.match(cardSource, /left: '-33\.35%'/)
  assert.match(cardSource, /width: '166\.7%'/)
  assert.match(cardSource, /transform: 'rotate\(53\.13deg\)'/)
})
