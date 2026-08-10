const ORGANIZATION_URL = 'https://usemewithstyle.shop/';
const ORGANIZATION_ID = `${ORGANIZATION_URL}#organization`;
const BRAND_LOGO_URL = 'https://ao.usemewithstyle.shop/brand/use-me-logo-black-transparent.png';
const INSTAGRAM_URL = 'https://www.instagram.com/use_me_withstyle/';
const SUPPORT_EMAIL = 'support@usemewithstyle.shop';

export function buildSiteStructuredData(origin: string) {
  const siteUrl = `${origin.replace(/\/+$/, '')}/`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Use Me With Style',
        url: ORGANIZATION_URL,
        logo: {
          '@type': 'ImageObject',
          url: BRAND_LOGO_URL,
          contentUrl: BRAND_LOGO_URL,
          width: 700,
          height: 315,
        },
        sameAs: [INSTAGRAM_URL],
        contactPoint: {
          '@type': 'ContactPoint',
          email: SUPPORT_EMAIL,
          contactType: 'customer support',
          areaServed: ['AO', 'PT'],
          availableLanguage: ['Portuguese', 'English'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: 'Use Me With Style',
        inLanguage: ['pt', 'en'],
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  };
}
