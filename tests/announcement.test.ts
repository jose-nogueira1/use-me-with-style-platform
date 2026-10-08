import assert from 'node:assert/strict'
import test from 'node:test'

import { announcementDuration, announcementRepeat, announcementTexts } from '../src/storefront/announcement.ts'

const items = [
  { id: 'message' as const, pt: 'Entrega grátis acima de 80.000 Kz', en: 'Free delivery over 80,000 Kz' },
  { id: 'coupon' as const, pt: 'Use o código BEMVINDA10 e ganhe 10% de desconto', en: '  ' },
]

test('the bar shows the active language and skips blank texts', () => {
  assert.deepEqual(announcementTexts(items, 'pt'), ['Entrega grátis acima de 80.000 Kz', 'Use o código BEMVINDA10 e ganhe 10% de desconto'])
  assert.deepEqual(announcementTexts(items, 'en'), ['Free delivery over 80,000 Kz'])
  assert.deepEqual(announcementTexts([], 'pt'), [])
})

test('one scrolling group is always repeated enough to be wider than any screen', () => {
  assert.equal(announcementRepeat(1), 8)
  assert.equal(announcementRepeat(2), 4)
  assert.ok(announcementRepeat(7) >= 2)
  assert.ok(announcementRepeat(0) >= 2)
})

test('scroll speed stays readable: longer or more repeated text takes longer, never faster than 30s', () => {
  const short = announcementDuration(['Entrega grátis'], 8)
  const long = announcementDuration(['Entrega grátis acima de 80.000 Kz', 'Use o código BEMVINDA10 e ganhe 10% de desconto'], 4)
  assert.ok(short >= 30)
  assert.ok(long > short)
})

import { parsePrerenderAnnouncement } from '../src/lib/prerenderBootstrap.ts'

test('the pre-rendered banner is reused only for its own market and ignores bad data', () => {
  const raw = JSON.stringify({ announcement: { market: 'AO', items: [{ id: 'message', pt: 'a', en: 'b' }] } })
  assert.equal(parsePrerenderAnnouncement(raw, 'AO').length, 1)
  assert.deepEqual(parsePrerenderAnnouncement(raw, 'PT'), [])
  assert.deepEqual(parsePrerenderAnnouncement('{"homeHero":{}}', 'AO'), [])
  assert.deepEqual(parsePrerenderAnnouncement('not json', 'AO'), [])
  assert.deepEqual(parsePrerenderAnnouncement(null, 'AO'), [])
})
