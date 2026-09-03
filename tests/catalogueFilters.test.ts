import assert from 'node:assert/strict';
import test from 'node:test';
import type { Product } from '../src/types/product.ts';
import { filterCatalogueProducts, type CatalogueFilterState } from '../src/lib/catalogueFilters.ts';

const base = {
  cat: 'vestidos',
  productType: 'standard' as const,
  priceKz: 100,
  priceEur: 10,
  effectivePriceKz: 100,
  effectivePriceEur: 10,
  onSale: false,
  sizes: ['S', 'M'],
  colors: [{ id: 'red', name: 'Vermelho' }],
  tags: [],
  isNewArrival: false,
  marketStatus: 'in_stock' as const,
  marketStock: 2,
  stock: { S: 2, M: 0 },
  variants: [
    { id: 'red-s', color: 'red', optionValue: 'S', stock: 2 },
    { id: 'red-m', color: 'red', optionValue: 'M', stock: 0 },
  ],
} as const;

const product = (overrides: Partial<Product>): Product => ({
  ...base,
  id: '1',
  name: 'Produto',
  slug: 'produto',
  catLabel: 'Vestidos',
  shippingWeightGrams: 500,
  specifications: [],
  returnEligible: true,
  bundleComponents: [],
  images: [],
  tone: 'light',
  ...overrides,
});

const emptyFilters: CatalogueFilterState = {
  availableOnly: false,
  minPrice: null,
  maxPrice: null,
  onSale: false,
  sizes: [],
  colors: [],
  collectionTags: [],
  productTypes: [],
};

test('catalogue filters combine dimensions with AND and values within a dimension with OR', () => {
  const matching = product({ id: 'match', onSale: true, effectivePriceKz: 80, tags: [{ slug: 'summer', label: 'Summer' }] });
  const wrongPrice = product({ id: 'wrong-price', effectivePriceKz: 140, onSale: true, tags: [{ slug: 'summer', label: 'Summer' }] });
  const soldOut = product({ id: 'sold-out', marketStatus: 'sold_out', marketStock: 0, variants: [{ id: 'red-s', color: 'red', optionValue: 'S', stock: 0 }], stock: { S: 0 } });

  const result = filterCatalogueProducts(
    [matching, wrongPrice, soldOut],
    { ...emptyFilters, availableOnly: true, minPrice: 50, maxPrice: 100, onSale: true, sizes: ['S'], colors: ['red'], collectionTags: ['summer'], productTypes: ['standard'] },
    'AO',
  );

  assert.deepEqual(result.map((item) => item.id), ['match']);
});

test('size and colour filters use actual stock, not merely configured options', () => {
  const zeroForSelectedSize = product({ id: 'zero-size', sizes: ['S', 'L'], variants: [{ id: 'red-l', color: 'red', optionValue: 'L', stock: 1 }], stock: { L: 1 } });
  const zeroForSelectedColour = product({ id: 'zero-colour', colors: [{ id: 'blue', name: 'Azul' }], variants: [{ id: 'blue-s', color: 'blue', optionValue: 'S', stock: 0 }], stock: { S: 0 }, marketStock: 0, marketStatus: 'sold_out' });
  const available = product({ id: 'available' });

  assert.deepEqual(
    filterCatalogueProducts([zeroForSelectedSize, available], { ...emptyFilters, sizes: ['S'] }, 'AO').map((item) => item.id),
    ['available'],
  );
  assert.deepEqual(
    filterCatalogueProducts([zeroForSelectedColour, available], { ...emptyFilters, colors: ['blue'] }, 'AO').map((item) => item.id),
    [],
  );
});

test('price filtering uses the effective price for the selected market', () => {
  const productOnSale = product({ id: 'sale', priceKz: 200, effectivePriceKz: 120, priceEur: 20, effectivePriceEur: 12, onSale: true });
  assert.deepEqual(
    filterCatalogueProducts([productOnSale], { ...emptyFilters, maxPrice: 125 }, 'AO').map((item) => item.id),
    ['sale'],
  );
  assert.deepEqual(
    filterCatalogueProducts([productOnSale], { ...emptyFilters, maxPrice: 11 }, 'PT').map((item) => item.id),
    [],
  );
});
