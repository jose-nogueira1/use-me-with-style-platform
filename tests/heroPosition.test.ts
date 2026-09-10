import test from 'node:test';
import assert from 'node:assert/strict';
import { heroPosition } from '../src/lib/heroPosition.ts';

test('existing heroes keep their desktop and mobile positioning', () => {
  assert.equal(heroPosition(undefined, 'desktop'), '65% 20%');
  assert.equal(heroPosition({}, 'mobile'), '50% 50%');
});
test('desktop and mobile positions remain independent, including zero', () => {
  const hero = { heroDesktopPositionX: 0, heroDesktopPositionY: 100, heroMobilePositionX: 80, heroMobilePositionY: 10 };
  assert.equal(heroPosition(hero, 'desktop'), '0% 100%');
  assert.equal(heroPosition(hero, 'mobile'), '80% 10%');
});
test('invalid legacy positions fall back or stay within the image bounds', () => {
  assert.equal(heroPosition({ heroDesktopPositionX: NaN, heroDesktopPositionY: null }, 'desktop'), '65% 20%');
  assert.equal(heroPosition({ heroMobilePositionX: -10, heroMobilePositionY: 125 }, 'mobile'), '0% 100%');
});
