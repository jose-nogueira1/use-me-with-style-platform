import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { C, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';

const CATS = [
  { key: 'all', labelKey: 'all' },
  { key: 'vestidos', labelKey: 'dresses' },
  { key: 'tops', labelKey: 'tops' },
  { key: 'leggings', labelKey: 'leggings' },
  { key: 'conjuntos', labelKey: 'sets' },
];

export function Browse() {
  const { market, lang } = useApp();
  const { products, loading } = useProducts(market, lang);
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';

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
    if (filterColor) list = list.filter((p) => p.colors.some((c) => c.toLowerCase() === filterColor.toLowerCase()));
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => (market === 'AO' ? a.priceKz - b.priceKz : a.priceEur - b.priceEur));
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => (market === 'AO' ? b.priceKz - a.priceKz : b.priceEur - a.priceEur));
    return list;
  }, [products, activeCat, searchTerm, filterSize, filterColor, sortBy, market]);

  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];
  const allColors = Array.from(new Set(products.flatMap((p) => p.colors)));

  return (
    <div className="ump-browse-layout" style={{ background: C.paper }}>
      <div className="ump-browse-sidebar">
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
          {t('filters', lang)}
        </div>
        <FilterGroup
          label={t('category', lang)}
          options={CATS.map((c) => t(c.labelKey, lang))}
          active={CATS.find((c) => c.key === activeCat) ? t(CATS.find((c) => c.key === activeCat)!.labelKey, lang) : null}
          onSelect={(label) => setActiveCat(CATS.find((c) => t(c.labelKey, lang) === label)?.key ?? 'all')}
        />
        <FilterGroup label={t('size', lang)} options={allSizes} active={filterSize} onSelect={setFilterSize} />
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
              <button onClick={() => setSearchTerm('')}>
                <X size={14} color={C.inkSoft} />
              </button>
            )}
          </div>
        </div>

        <div className="ump-browse-catpills" style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }}>
          {CATS.map((c) => (
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
              {t(c.labelKey, lang)}
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
            <FilterGroup label={t('size', lang)} options={allSizes} active={filterSize} onSelect={setFilterSize} />
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

function FilterGroup({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: string[];
  active: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <FilterLabel>{label}</FilterLabel>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(active === opt ? null : opt)}
            style={{
              minWidth: 36,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${active === opt ? C.gold : C.rule}`,
              background: active === opt ? C.tagBg : C.paper,
              color: active === opt ? C.goldDeep : C.ink,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
