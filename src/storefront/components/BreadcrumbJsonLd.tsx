import { buildBreadcrumbStructuredData, type BreadcrumbItem } from '../../lib/breadcrumbStructuredData';
import { serializeJsonLd } from '../../lib/jsonLd';

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2 || typeof window === 'undefined') return null;
  const structuredData = buildBreadcrumbStructuredData(window.location.origin, items);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />;
}
