import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProductStructuredData, serializeJsonLd } from '../src/lib/productStructuredData.ts';

const product = {
  id: 'product-42',
  name: 'Leggings Movimento',
  description: 'Leggings de cintura alta para treino.',
  catLabel: 'Leggings',
  effectivePriceKz: 35000,
  effectivePriceEur: 49.9,
  images: [
    { url: 'https://cdn.example.com/front.jpg', alt: 'Leggings Movimento frente' },
    { url: 'https://cdn.example.com/back.jpg', alt: 'Leggings Movimento costas' },
  ],
  variants: [
    { id: 'variant-1', sku: 'UMS-LEG-MOV-S', stock: 2 },
    { id: 'variant-2', sku: 'UMS-LEG-MOV-M', stock: 0 },
  ],
};

test('Product JSON-LD exposes current AO price, ISO currency, stock and canonical URL', () => {
  const url = 'https://ao.usemewithstyle.shop/produto/leggings-movimento';
  const data = buildProductStructuredData({ product, market: 'AO', url, fallbackDescription: 'Fallback' });

  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@type'], 'Product');
  assert.equal(data['@id'], `${url}#product`);
  assert.equal(data.name, product.name);
  assert.equal(data.description, product.description);
  assert.equal(data.sku, 'UMS-LEG-MOV-S');
  assert.deepEqual(data.image, product.images.map((image) => image.url));
  assert.deepEqual(data.brand, { '@type': 'Brand', name: 'Use Me With Style' });
  assert.equal(data.offers.url, url);
  assert.equal(data.offers.price, '35000');
  assert.equal(data.offers.priceCurrency, 'AOA');
  assert.equal(data.offers.availability, 'https://schema.org/InStock');
  assert.equal(data.offers.itemCondition, 'https://schema.org/NewCondition');
});

test('Product JSON-LD uses EUR decimals and reports genuinely sold-out products', () => {
  const soldOut = {
    ...product,
    description: undefined,
    images: [],
    variants: product.variants.map((variant) => ({ ...variant, stock: 0, sku: undefined })),
  };
  const data = buildProductStructuredData({
    product: soldOut,
    market: 'PT',
    url: 'https://pt.usemewithstyle.shop/produto/leggings-movimento',
    fallbackDescription: 'Descrição de produto.',
  });

  assert.equal(data.description, 'Descrição de produto.');
  assert.equal(data.sku, product.id);
  assert.equal('image' in data, false);
  assert.equal(data.offers.price, '49.90');
  assert.equal(data.offers.priceCurrency, 'EUR');
  assert.equal(data.offers.availability, 'https://schema.org/OutOfStock');
});

test('JSON-LD serialization cannot be terminated by CMS-authored script markup', () => {
  const serialized = serializeJsonLd({ description: '</script><script>alert(1)</script>' });
  assert.equal(serialized.includes('</script>'), false);
  assert.deepEqual(JSON.parse(serialized), { description: '</script><script>alert(1)</script>' });
});
