import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { C, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { fetchCategories, fetchMerchTags, type ApiCategory, type ApiMerchTag } from '../../lib/api';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';

// Categories became admin-managed CMS data on 2026-07-25 (previously a
// hardcoded enum), so the pills/sidebar are built from the API. This
// fallback covers only the brief moment before the fetch resolves (and an
// unreachable CMS, where the catalogue is empty anyway).
const FALLBACK_CATS: ApiCategory[] = [
  { id: 'vestidos', namePT: 'Vestidos', nameEN: 'Dresses', slug: 'vestidos' },
  { id: 'tops', namePT: 'Tops', nameEN: 'Tops', slug: 'tops' },
  { id: 'leggings', namePT: 'Leggings', nameEN: 'Leggings', slug: 'leggings' },
  { id: 'conjuntos', namePT: 'Conjuntos', nameEN: 'Sets', slug: 'conjuntos' },
];

export function Browse() {
  const { market, lang } = useApp();
  const { products, loading } = useProducts(market, lang);
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<ApiCategory[]>(FALLBACK_CATS);
  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((docs) => {
        if (!cancelled && docs.length > 0) setCategories(docs);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Merch tags as "collections" (2026-07-25 follow-up to the home hero
  // button -- see AskUserQuestion decision): only fetched to resolve a
  // ?tag=<slug> URL param into a display label for the "Filtered by" banner
  // below. The actual product filtering uses Product.tagSlug directly
  // (productAdapters.ts), so this fetch failing just loses the label, not
  // the filter itself.
  const [tags, setTags] = useState<ApiMerchTag[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchMerchTags()
      .then((docs) => {
        if (!cancelled) setTags(docs);
      })
      .catch(() => {
        /* label falls back to the raw slug */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cats = useMemo(
    () => [
      { key: 'all', label: t('all', lang) },
      // Pseudo-category (2026-07-25 navbar fix): the "Novidades"/"New
      // arrivals" nav link points at ?cat=new, but 'new' was never a real
      // category slug once categories became real CMS data -- it always
      // matched zero products. Filtered on the product's merch tag instead
      // (see productAdapters.ts's isNewArrival), but kept in this same list
      // so it still renders and highlights like any other pill/filter.
      { key: 'new', label: t('newArrivalsNav', lang) },
      ...categories
        .filter((c) => c.slug)
        .map((c) => ({ key: c.slug as string, label: (lang === 'en' ? c.nameEN : c.namePT)?.trim() || c.namePT })),
    ],
    [categories, lang],
  );

  // Re-syncs the active category whenever the URL's ?cat= param changes
  // (2026-07-25 navbar fix). This used to be a plain useState initialized
  // once from the URL and never revisited -- but clicking a top-nav
  // category link while ALREADY on /catalogo (e.g. Vestidos -> Conjuntos)
  // is a client-side route change within the same component instance, not
  // a remount, so activeCat silently stayed frozen at whatever it was the
  // first time and every subsequent nav-link click did nothing visible
  // (confirmed via screen recording: no pill ever highlighted after the
  // first click, filters stuck showing 0 results). Adjusting state during
  // render (comparing against the last-seen URL value) rather than in a
  // useEffect, per https://react.dev/learn/you-might-not-need-an-effect --
  // avoids an extra render pass and the associated lint rule.
  const urlCat = searchParams.get('cat') || 'all';
  const [activeCat, setActiveCat] = useState(urlCat);
  const [syncedUrlCat, setSyncedUrlCat] = useState(urlCat);
  if (urlCat !== syncedUrlCat) {
    setSyncedUrlCat(urlCat);
    setActiveCat(urlCat);
  }

  // ?tag=<slug> "collection" filter (2026-07-25 follow-up): the home hero
  // button can now point at a merchandising tag instead of just a category
  // (e.g. /catalogo?tag=ss26). Same render-time URL-sync pattern as
  // activeCat/syncedUrlCat above, for the same reason -- a same-route nav
  // (clicking the hero button while already on /catalogo) doesn't remount
  // this component. null means "no tag filter", distinct from activeCat's
  // 'all' since the two filters are independent and both can apply at once.
  const urlTag = searchParams.get('tag');
  const [activeTag, setActiveTag] = useState(urlTag);
  const [syncedUrlTag, setSyncedUrlTag] = useState(urlTag);
  if (urlTag !== syncedUrlTag) {
    setSyncedUrlTag(urlTag);
    setActiveTag(urlTag);
  }
  const activeTagLabel = activeTag
    ? (() => {
        const doc = tags.find((tg) => tg.slug === activeTag);
        return doc ? (lang === 'en' ? doc.labelEN : doc.labelPT)?.trim() || doc.labelPT : activeTag;
      })()
    : null;

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat === 'new') list = list.filter((p) => p.isNewArrival);
    else if (activeCat !== 'all') list = list.filter((p) => p.cat === activeCat);
    if (activeTag) list = list.filter((p) => p.tagSlug === activeTag);
    if (searchTerm) list = list.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterSize) list = list.filter((p) => p.sizes.includes(filterSize));
    if (filterColor) list = list.filter((p) => p.colors.some((c) => c.id === filterColor));
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => (market === 'AO' ? a.priceKz - b.priceKz : a.priceEur - b.priceEur));
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => (market === 'AO' ? b.priceKz - a.priceKz : b.priceEur - a.priceEur));
    return list;
  }, [products, activeCat, activeTag, searchTerm, filterSize, filterColor, sortBy, market]);

  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];
  // Dedupe by colour id (2026-07-25 bilingual follow-up: was name, but two
  // colours could now share a display name across languages by
  // coincidence, and id is the real, language-independent identity anyway).
  const allColors = useMemo(() => {
    const byId = new Map<string, { value: string; label: string; hex?: string; hex2?: string; swatchUrl?: string }>();
    for (const c of products.flatMap((p) => p.colors)) {
      if (!byId.has(c.id)) byId.set(c.id, { value: c.id, label: c.name, hex: c.hex, hex2: c.hex2, swatchUrl: c.swatchUrl });
    }
    return Array.from(byId.values());
  }, [products]);

  return (
    <div className="ump-browse-layout" style={{ background: C.paper }}>
      <div className="ump-browse-sidebar">
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
          {t('filters', lang)}
        </div>
        <FilterGroup
          label={t('category', lang)}
          options={cats.map((c) => ({ value: c.key, label: c.label }))}
          active={activeCat === 'all' ? null : activeCat}
          onSelect={(key) => setActiveCat(key ?? 'all')}
        />
        <FilterGroup label={t('size', lang)} options={allSizes.map((s) => ({ value: s, label: s }))} active={filterSize} onSelect={setFilterSize} />
        <FilterGroup label={t('colour', lang)} options={allColors} active={filterColor} onSelect={setFilterColor} />
        <div>
          <FilterLabel>{t('sort', lang)}</FilterLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {([
              { key: 'default' as const, labelKey: 'sortDefault' },
              { key: 'price-asc' as const, labelKey: 'sortPriceAsc' },
              { key: 'price-desc' as const, labelKey: 'sortPriceDesc' },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: `1px solid ${sortBy === s.key ? C.gold : C.fieldBorder}`,
                  background: sortBy === s.key ? C.tagBg : C.paper,
                  color: sortBy === s.key ? C.goldDeep : C.ink,
                }}
              >
                {t(s.labelKey, lang)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ump-browse-main">
        <h1 className="ump-sr-only">{t('shopAll', lang)}</h1>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.ruleLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.paper, borderRadius: 8, border: `1px solid ${C.fieldBorder}` }}>
            <Search size={16} color={C.inkSoft} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchProducts', lang)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.ink, background: 'transparent' }}
            />
            {searchTerm && (
              <button aria-label={lang === 'pt' ? 'Limpar pesquisa' : 'Clear search'} onClick={() => setSearchTerm('')}>
                <X size={14} color={C.inkSoft} />
              </button>
            )}
          </div>
        </div>

        <div className="ump-browse-catpills" style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }}>
          {cats.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              style={{
                flexShrink: 0,
                padding: '7px 16px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 20,
                background: activeCat === c.key ? C.ctaBg : C.paper,
                color: activeCat === c.key ? C.onDarkGold : C.ink,
                border: `1px solid ${activeCat === c.key ? C.ctaBorder : C.fieldBorder}`,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {activeTagLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.tagBg, borderBottom: `1px solid ${C.ruleLight}` }}>
            <span style={{ fontSize: 11, color: C.goldDeep, fontWeight: 700 }}>
              {lang === 'en' ? 'Collection: ' : 'Coleção: '}{activeTagLabel}
            </span>
            <button
              onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.delete('tag'); return p; })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: C.inkSoft }}
            >
              <X size={11} /> {lang === 'en' ? 'Clear' : 'Limpar'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', borderBottom: `1px solid ${C.ruleLight}` }}>
          <div style={{ fontSize: 11, color: C.inkSoft }}>
            {loading ? '…' : `${filtered.length} ${t(filtered.length === 1 ? 'productSingular' : 'productPlural', lang)}`}
          </div>
          <button
            className="ump-browse-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.goldDeep, padding: '4px 8px', borderRadius: 6, background: showFilters ? C.tagBg : 'transparent' }}
          >
            <Filter size={12} />
            {t('filters', lang)}
          </button>
        </div>

        {showFilters && (
          <div className="ump-slide-up ump-browse-filter-toggle" style={{ padding: '16px 20px', background: C.subtleBg, borderBottom: `1px solid ${C.ruleLight}` }}>
            <FilterGroup label={t('size', lang)} options={allSizes.map((s) => ({ value: s, label: s }))} active={filterSize} onSelect={setFilterSize} />
            <FilterGroup label={t('colour', lang)} options={allColors} active={filterColor} onSelect={setFilterColor} />
          </div>
        )}

        <div className="ump-grid-auto" style={{ padding: '16px 20px', minHeight: 200 }}>
          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '40px 20px', textAlign: 'center', color: C.inkSoft, fontSize: 13 }}>{t('noProductsFound', lang)}</div>
          )}
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, marginBottom: 6, textTransform: 'uppercase' }}>{children}</div>
  );
}

type FilterOption = {
  value: string;
  label: string;
  /** Colour options (2026-07-25): render a swatch dot from the taxonomy's
   * hex, or a tiny fabric-swatch image for patterns. Text-only otherwise.
   * hex2 (2026-07-25 follow-up) renders a split circle for combination
   * colours -- see lib/colorSwatch.ts. */
  hex?: string;
  hex2?: string;
  swatchUrl?: string;
};

function FilterGroup({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: FilterOption[];
  active: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <FilterLabel>{label}</FilterLabel>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(active === opt.value ? null : opt.value)}
            style={{
              minWidth: 36,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${active === opt.value ? C.gold : C.fieldBorder}`,
              background: active === opt.value ? C.tagBg : C.paper,
              color: active === opt.value ? C.goldDeep : C.ink,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {hasSwatch(opt) && (
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: `1px solid ${C.fieldBorder}`,
                  background: swatchBackground(opt),
                }}
              />
            )}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
