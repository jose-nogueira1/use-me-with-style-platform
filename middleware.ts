/**
 * Geo-routing must happen before the SPA shell is served. The former
 * client-side redirect let crawlers receive a 200 HTML page for the apex,
 * which is why Google could index that fallback shell instead of the AO/PT
 * storefronts. This edge redirect preserves the visitor's route and query
 * string, without indexing the geo-routing endpoint itself.
 */
export default function geoMarketRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  const apex = 'usemewithstyle.shop';

  if (hostname !== apex && hostname !== `www.${apex}`) return undefined;

  const country = request.headers.get('x-vercel-ip-country');
  url.hostname = `${country === 'AO' ? 'ao' : 'pt'}.${apex}`;

  return new Response(null, {
    status: 307,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'private, no-store',
      Vary: 'x-vercel-ip-country',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}

export const config = {
  matcher: '/((?!api/|assets/|_next/|__prerender/|favicon\\.(?:ico|png)|favicon-dark\\.png|apple-touch-icon\\.png|robots\\.txt|sitemap\\.xml).*)',
};
