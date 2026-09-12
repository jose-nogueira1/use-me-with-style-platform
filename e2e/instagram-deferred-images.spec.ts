import { expect, test } from '@playwright/test';

test('homepage waits until the Instagram section is near view before loading responsive thumbnails', async ({ page }) => {
  let feedRequests = 0;

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/instagram-feed') {
      feedRequests += 1;
      return route.fulfill({
        json: {
          configured: true,
          posts: [{
            id: 'post-1',
            lookSlug: 'look-1',
            imageUrl: 'https://images.example.test/original.jpg',
            thumbnailUrl: '/api/instagram-thumbnail/post-1?width=480',
            thumbnailLargeUrl: '/api/instagram-thumbnail/post-1?width=960',
            mediaType: 'IMAGE',
            permalink: 'https://instagram.com/p/look-1/',
            caption: 'New collection',
            captionDisplay: 'New collection',
            size: 'regular',
            products: [],
          }],
        },
      });
    }
    if (url.pathname.startsWith('/api/instagram-thumbnail/')) {
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="tan"/></svg>',
      });
    }
    if (url.pathname === '/api/products' || url.pathname === '/api/categories') {
      return route.fulfill({ json: { docs: [] } });
    }
    return route.fulfill({ json: {} });
  });

  // A short viewport keeps the feed outside its intentional 300px prefetch
  // margin regardless of how many catalogue shelves the fixture renders.
  await page.setViewportSize({ width: 390, height: 240 });
  await page.goto('/');
  const section = page.locator('[data-instagram-load]');
  await expect(section).toHaveAttribute('data-instagram-load', 'deferred');
  expect(feedRequests).toBe(0);

  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-instagram-load', 'ready');
  await expect.poll(() => feedRequests).toBe(1);
  const image = section.locator('img[data-artwork]').first();
  await expect(image).toHaveAttribute('src', /instagram-thumbnail\/post-1\?width=960/);
  await expect(image).toHaveAttribute('srcset', /width=480 480w, .*width=960 960w/);
});
