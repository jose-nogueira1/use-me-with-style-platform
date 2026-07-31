import { test, expect } from '@playwright/test';
import { mockCheckoutBackend } from './helpers/mockCheckout';

// Clear-all-filters on /catalogo (2026-07-30).
//
// Browse accumulated six independent filter dimensions -- category,
// collection tag, search term, size, colour and sort -- spread across a
// desktop sidebar, a collapsible mobile panel and a row of category pills.
// Three of them are multi-select, and two live in the URL rather than in
// component state (?cat= and ?tag=), so a reset that only touched local
// state would let the URL immediately reinstate what it just cleared.
//
// The category cases below also guard the comma-separated ?cat= encoding:
// existing nav links and home category tiles still point at a single slug,
// so the format has to stay backward compatible.

test.describe('Browse — clear all filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockCheckoutBackend(page);
  });

  test('is hidden until a filter is active', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /clear all filters|limpar todos os filtros/i })).toHaveCount(0);

    await page.getByPlaceholder(/search products|pesquisar produtos/i).fill('Vestido');
    await expect(
      page.getByRole('button', { name: /clear all filters|limpar todos os filtros/i }).first(),
    ).toBeVisible();
  });

  test('resets every dimension, including the URL params', async ({ page }) => {
    // Arrive with BOTH url-driven filters set, then add local-state ones on
    // top, so the reset has to handle both kinds at once.
    await page.goto('/catalogo?cat=vestidos&tag=ss26');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/search products|pesquisar produtos/i).fill('Vestido');
    await page.getByRole('button', { name: 'M', exact: true }).first().click();

    // Sort away from the default so we can prove it resets too.
    await page.getByRole('button', { name: /^price ↑$|^preço ↑$/i }).first().click();

    await page.getByRole('button', { name: /clear all filters|limpar todos os filtros/i }).first().click();

    // URL params gone -- ?cat= IS the category state, so leaving it behind
    // would mean the category was never actually cleared.
    await expect(page).toHaveURL(/\/catalogo(\?.*)?$/);
    expect(new URL(page.url()).searchParams.get('cat')).toBeNull();
    expect(new URL(page.url()).searchParams.get('tag')).toBeNull();

    // Search cleared.
    await expect(page.getByPlaceholder(/search products|pesquisar produtos/i)).toHaveValue('');

    // Collection banner gone.
    await expect(page.getByText(/^(collection|coleção):/i)).toHaveCount(0);

    // Sort back to default: the default option is the selected one again.
    const defaultSort = page.getByRole('button', { name: /^default$|^padrão$/i }).first();
    await expect(defaultSort).toBeVisible();

    // And the control removes itself once nothing is active.
    await expect(page.getByRole('button', { name: /clear all filters|limpar todos os filtros/i })).toHaveCount(0);
  });

  test('category accepts several values and encodes them in the URL', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    // Targets the desktop sidebar's FilterGroup, not the .ump-browse-catpills
    // row -- that row is mobile-only (display: none from 720px in App.tsx),
    // so at Playwright's default desktop viewport it's excluded from the
    // accessibility tree and getByRole can't see it.
    const pills = page.locator('.ump-browse-sidebar');
    const dresses = pills.getByRole('button', { name: /^(dresses|vestidos)$/i });
    const sets = pills.getByRole('button', { name: /^(sets|conjuntos)$/i });
    const all = pills.getByRole('button', { name: /^(all|tudo)$/i });

    await expect(all).toHaveAttribute('aria-pressed', 'true');

    await dresses.click();
    await sets.click();

    await expect(dresses).toHaveAttribute('aria-pressed', 'true');
    await expect(sets).toHaveAttribute('aria-pressed', 'true');
    // "All" reads as off precisely when something else is on.
    await expect(all).toHaveAttribute('aria-pressed', 'false');

    // Shareable: both categories survive in the URL.
    const cat = new URL(page.url()).searchParams.get('cat');
    expect(cat?.split(',').sort()).toEqual(['conjuntos', 'vestidos']);

    // A badge each.
    await expect(page.getByRole('button', { name: /^(remove filter|remover filtro):.*(category|categoria)/i })).toHaveCount(2);

    // "All" is a reset, not a value that stacks with the others.
    await all.click();
    await expect(all).toHaveAttribute('aria-pressed', 'true');
    await expect(dresses).toHaveAttribute('aria-pressed', 'false');
    expect(new URL(page.url()).searchParams.get('cat')).toBeNull();
  });

  test('a single-value ?cat= link still works', async ({ page }) => {
    // Top-nav links and home category tiles still point at ?cat=<one-slug>,
    // so the comma-separated format has to stay backward compatible.
    await page.goto('/catalogo?cat=vestidos');
    await page.waitForLoadState('networkidle');

    // Same desktop-viewport reasoning as the test above: the sidebar, not
    // the mobile-only pill row, is what's actually visible here.
    const dresses = page.locator('.ump-browse-sidebar').getByRole('button', { name: /^(dresses|vestidos)$/i });
    await expect(dresses).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /^(remove filter|remover filtro):.*(category|categoria)/i })).toHaveCount(1);
  });

  test('size and colour accept several values at once', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    const sizeS = page.getByRole('button', { name: 'S', exact: true }).first();
    const sizeM = page.getByRole('button', { name: 'M', exact: true }).first();

    await sizeS.click();
    await sizeM.click();

    // Both stay selected -- picking the second must not clear the first.
    await expect(sizeS).toHaveAttribute('aria-pressed', 'true');
    await expect(sizeM).toHaveAttribute('aria-pressed', 'true');

    // One badge per selected value, not one per dimension.
    await expect(page.getByRole('button', { name: /^(remove filter|remover filtro):.*(size|tamanho): S$/i })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /^(remove filter|remover filtro):.*(size|tamanho): M$/i })).toHaveCount(1);

    // Re-clicking a selected chip deselects just that one.
    await sizeS.click();
    await expect(sizeS).toHaveAttribute('aria-pressed', 'false');
    await expect(sizeM).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /^(remove filter|remover filtro):.*(size|tamanho): S$/i })).toHaveCount(0);
  });

  test('shows a badge per active filter, each removable on its own', async ({ page }) => {
    await page.goto('/catalogo?tag=ss26');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/search products|pesquisar produtos/i).fill('Vestido');
    await page.getByRole('button', { name: 'M', exact: true }).first().click();

    const badges = page.getByRole('button', { name: /^(remove filter|remover filtro):/i });
    // collection + search + size
    await expect(badges).toHaveCount(3);

    // Removing one badge leaves the others alone.
    await page.getByRole('button', { name: /^(remove filter|remover filtro):.*(size|tamanho)/i }).click();
    await expect(badges).toHaveCount(2);
    await expect(page.getByPlaceholder(/search products|pesquisar produtos/i)).toHaveValue('Vestido');

    // The collection badge clears the URL param, not just local state --
    // otherwise the render-time ?tag= sync re-applies it immediately.
    await page.getByRole('button', { name: /^(remove filter|remover filtro):.*(collection|coleção)/i }).click();
    expect(new URL(page.url()).searchParams.get('tag')).toBeNull();
    await expect(badges).toHaveCount(1);

    // Down to a single filter, its badge is the only control needed, so the
    // redundant clear-all in this bar steps aside.
    await page.getByRole('button', { name: /^(remove filter|remover filtro):.*(search|pesquisa)/i }).click();
    await expect(badges).toHaveCount(0);
  });

  test('sort appears as a badge, matching what clear-all resets', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /^price ↑$|^preço ↑$/i }).first().click();

    const sortBadge = page.getByRole('button', { name: /^(remove filter|remover filtro):.*(sort|ordenar)/i });
    await expect(sortBadge).toBeVisible();

    await sortBadge.click();
    await expect(sortBadge).toHaveCount(0);
  });

  test('offers a way out of a zero-result filter combination', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    // A search that matches nothing in the mocked catalogue.
    await page.getByPlaceholder(/search products|pesquisar produtos/i).fill('zzzzz-no-such-product');

    await expect(page.getByText(/no products match the selected filters|nenhum produto corresponde aos filtros/i)).toBeVisible();

    // The empty state carries its own reset, so the shopper isn't left at a
    // dead end having to work out which filter to undo.
    await page
      .getByRole('button', { name: /clear all filters|limpar todos os filtros/i })
      .last()
      .click();

    await expect(page.getByPlaceholder(/search products|pesquisar produtos/i)).toHaveValue('');
    await expect(page.getByText(/no products match the selected filters|nenhum produto corresponde aos filtros/i)).toHaveCount(0);
  });
});
