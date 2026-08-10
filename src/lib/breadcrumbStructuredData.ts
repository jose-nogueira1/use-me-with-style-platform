export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildBreadcrumbStructuredData(origin: string, items: BreadcrumbItem[]) {
  const siteOrigin = origin.replace(/\/+$/, '');
  const normalized = items
    .map((item) => ({ name: item.name.trim(), path: item.path.trim() }))
    .filter((item) => item.name && item.path.startsWith('/'));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: normalized.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteOrigin}${item.path}`,
    })),
  };
}
