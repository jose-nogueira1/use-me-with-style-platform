import assert from 'node:assert/strict'
import test from 'node:test'

import { hoverImage } from '../src/lib/hoverImage.ts'

const img = (url: string, colorId?: string) => ({ url, alt: url, colorId })

test('the hover photo is the second photo of the product', () => {
  assert.equal(hoverImage([img('a'), img('b'), img('c')])?.url, 'b')
})

test('a product with one photo, or none, has no hover photo', () => {
  assert.equal(hoverImage([img('a')]), undefined)
  assert.equal(hoverImage([]), undefined)
  assert.equal(hoverImage([img('a'), img('a')]), undefined) // same file twice is not a second photo
})

test('a colour-tagged first photo is never followed by another colour', () => {
  assert.equal(hoverImage([img('red-1', 'red'), img('blue-1', 'blue'), img('red-2', 'red')])?.url, 'red-2')
  assert.equal(hoverImage([img('red-1', 'red'), img('blue-1', 'blue')]), undefined)
})

test('untagged (general) photos fit any colour', () => {
  assert.equal(hoverImage([img('red-1', 'red'), img('studio')])?.url, 'studio')
  assert.equal(hoverImage([img('studio'), img('red-1', 'red')])?.url, 'red-1')
})
