import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { C, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { fetchCategories, type ApiCategory } from '../../lib/api';

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
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';

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

  const cats = useMemo(
    () => [
      { key: 'all', label: t('all', lang) },
      ...categories
        .filter((c) => c.slug)
        .map((c) => ({ key: c.slug as string, label: (lang === 'en' ? c.nameEN : c.namePT)?.trim() || c.namePT })),
    ],
    [categories, lang],
  );

  const [activeCat, setActiveCat] = useState(initialCat);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat !== 'all') list = list.filter((p) => p.cat === activeCat);
    if (searchTerm) list = list.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterSize) list = list.filter((p) => p.sizes.includes(filterSize));
    if (filterColor) list = list.filter((p) => p.colors.some((c) => c.name.toLowerCase() === filterColor.toLowerCase()));
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => (market === 'AO' ? a.priceKz - b.priceKz : a.priceEur - b.priceEur));
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => (market === 'AO' ? b.priceKz - a.priceKz : b.priceEur - a.priceEur));
    return list;
  }, [products, activeCat, searchTerm, filterSize, filterColor, sortBy, market]);

  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];
  // Dedupe by colour name, keeping the first swatch seen for each -- the
  // taxonomy guarantees consistent names, so first-wins is safe.
  const allColors = useMemo(() => {
    const byName = new Map<string, { value: string; label: string; hex?: string; swatchUrl?: string }>();
    for (const c of products.flatMap((p) => p.colors)) {
      if (!byName.has(c.name)) byName.set(c.name, { value: c.name, label: c.name, hex: c.hex, swatchUrl: c.swatchUrl });
    }
    return Array.from(byName.values());
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
                  border: `1px solid ${sortBy === s.key ? C.gold : C.rule}`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.paper, borderRadius: 8, border: `1px solid ${C.rule}` }}>
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
                background: activeCat === c.key ? C.black : C.paper,
                color: activeCat === c.key ? C.onDarkGold : C.ink,
                border: `1px solid ${activeCat === c.key ? C.black : C.rule}`,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

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
   * hex, or a tiny fabric-swatch image for patterns. Text-only otherwise. */
  hex?: string;
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
              border: `1px solid ${active === opt.value ? C.gold : C.rule}`,
              background: active === opt.value ? C.tagBg : C.paper,
              color: active === opt.value ? C.goldDeep : C.ink,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {(opt.swatchUrl || opt.hex) && (
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: `1px solid ${C.rule}`,
                  background: opt.swatchUrl ? `center / cover url(${opt.swatchUrl})` : opt.hex,
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
