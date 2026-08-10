import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildSiteStructuredData } from '../src/lib/siteStructuredData.ts';

const projectFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('site JSON-LD identifies the shared organization with real brand and support details', () => {
  const data = buildSiteStructuredData('https://ao.usemewithstyle.shop');
  const organization = data['@graph'][0];

  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(organization['@type'], 'Organization');
  assert.equal(organization['@id'], 'https://usemewithstyle.shop/#organization');
  assert.equal(organization.name, 'Use Me With Style');
  assert.equal(organization.url, 'https://usemewithstyle.shop/');
  assert.equal(organization.logo.url, 'https://ao.usemewithstyle.shop/brand/use-me-logo-black-transparent.png');
  assert.deepEqual(organization.sameAs, ['https://www.instagram.com/use_me_withstyle/']);
  assert.equal(organization.contactPoint.email, 'support@usemewithstyle.shop');
  assert.deepEqual(organization.contactPoint.areaServed, ['AO', 'PT']);
  assert.deepEqual(organization.contactPoint.availableLanguage, ['Portuguese', 'English']);
});

test('WebSite JSON-LD uses the active market origin and references the shared organization', () => {
  const ao = buildSiteStructuredData('https://ao.usemewithstyle.shop')['@graph'][1];
  const pt = buildSiteStructuredData('https://pt.usemewithstyle.shop/')['@graph'][1];

  assert.equal(ao['@type'], 'WebSite');
  assert.equal(ao.url, 'https://ao.usemewithstyle.shop/');
  assert.equal(ao['@id'], 'https://ao.usemewithstyle.shop/#website');
  assert.equal(pt.url, 'https://pt.usemewithstyle.shop/');
  assert.deepEqual(pt.inLanguage, ['pt', 'en']);
  assert.deepEqual(pt.publisher, { '@id': 'https://usemewithstyle.shop/#organization' });
});

test('Organization JSON-LD only publishes a valid optional TikTok profile', () => {
  const valid = buildSiteStructuredData('https://ao.usemewithstyle.shop', 'https://tiktok.com/@use_me.withstyle?lang=en')['@graph'][0];
  const invalid = buildSiteStructuredData('https://ao.usemewithstyle.shop', 'https://example.com/@use_me.withstyle')['@graph'][0];

  assert.deepEqual(valid.sameAs, [
    'https://www.instagram.com/use_me_withstyle/',
    'https://www.tiktok.com/@use_me.withstyle',
  ]);
  assert.deepEqual(invalid.sameAs, ['https://www.instagram.com/use_me_withstyle/']);
});

test('the shared storefront layout emits site structured data once', () => {
  const source = projectFile('src/storefront/StorefrontLayout.tsx');
  assert.match(source, /buildSiteStructuredData\(origin, tiktokUrl\)/);
  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /serializeJsonLd\(siteJsonLd\)/);
});
