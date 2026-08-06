import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminListProducts, productIsLowStock, resolveProductImage, resolveRef, type ApiProduct } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';

export function Products() {
  const { lang } = useApp();
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('filter');
  const filter = (['active', 'draft', 'low', 'photo'].includes(requestedFilter ?? '')
    ? requestedFilter
    : 'all') as 'all' | 'active' | 'draft' | 'low' | 'photo';
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const setFilter = (value: 'all' | 'active' | 'draft' | 'low' | 'photo') => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('filter');
    else next.set('filter', value);
    setSearchParams(next);
  };

  useEffect(() => {
    adminListProducts()
      .then(setProducts)
      .catch(() => setError(true));
  }, []);

  const hasPhoto = (p: ApiProduct) => (p.images?.length ?? 0) > 0;

  const filtered = (products ?? []).filter((p) => {
    if (filter === 'active') return p.active;
    if (filter === 'draft') return !p.active;
    if (filter === 'low') return productIsLowStock(p);
    if (filter === 'photo') return !hasPhoto(p);
    return true;
  });

  const counts = {
    all: products?.length ?? 0,
    active: products?.filter((p) => p.active).length ?? 0,
    draft: products?.filter((p) => !p.active).length ?? 0,
    low: products?.filter(productIsLowStock).length ?? 0,
    photo: products?.filter((p) => !hasPhoto(p)).length ?? 0,
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('navProducts', lang)}
        title={t('catalogueControl', lang)}
        subtitle={t('catalogueControlSubtitle', lang)}
        cta={t('addProduct', lang)}
        onCta={() => navigate('/admin/produtos/novo')}
      />

      <div style={{ padding: '20px 28px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FilterPill label={t('filterAll', lang, { n: counts.all })} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterPill label={t('filterActive', lang, { n: counts.active })} active={filter === 'active'} onClick={() => setFilter('active')} />
        <FilterPill label={t('filterDraft', lang, { n: counts.draft })} active={filter === 'draft'} onClick={() => setFilter('draft')} />
        <FilterPill label={t('filterLowStock', lang, { n: counts.low })} active={filter === 'low'} onClick={() => setFilter('low')} />
        <FilterPill label={t('filterPhotoPending', lang, { n: counts.photo })} active={filter === 'photo'} onClick={() => setFilter('photo')} />
      </div>

      {error && <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }} className="ump-admin-product-grid">
        {filtered.map((p) => (
          <Link key={p.id} to={`/admin/produtos/${p.id}`} style={{ textDecoration: 'none', display: 'block', background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
            <div style={{ height: 110, borderRadius: 6, background: '#F1EADF', border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep }}>{hasPhoto(p) ? '' : t('photoPending', lang)}</span>
              {hasPhoto(p) && <img src={resolveProductImage(p.images![0].image).url} alt={resolveProductImage(p.images![0].image).alt ?? p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />}
            </div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 12 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>
              AO Kz {p.priceAOKz.toLocaleString('en-US')} / PT EUR {p.pricePTEur}.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {/* Variant-level stock (2026-07-25): chip per size, total
                  summed across colours -- the editor's matrix has the
                  per-colour detail. */}
              {aggregateSizes(p).map((s) => {
                const total = s.stockAO + s.stockPT;
                const zero = total === 0;
                return (
                  <div
                    key={s.size}
                    style={{
                      padding: '6px 8px',
                      fontSize: 9,
                      fontWeight: 800,
                      borderRadius: 6,
                      background: zero ? '#FFF0EB' : C.subtleBg,
                      border: `1px solid ${zero ? '#E1B3AA' : C.ruleLight}`,
                      color: zero ? '#B95545' : C.ink,
                    }}
                  >
                    {s.size} {total}
                  </div>
                );
              })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function aggregateSizes(p: ApiProduct) {
  if (p.productType === 'bundle') {
    const componentStock = (market: 'AO' | 'PT') => {
      const stocks = (p.bundleComponents ?? []).map((component) => {
        const product = resolveRef(component.product);
        const variant = product?.variants?.find((row) => String(row.id) === String(component.variantId));
        return Math.floor(Number(market === 'AO' ? variant?.stockAO ?? 0 : variant?.stockPT ?? 0) / Math.max(1, Number(component.qty)));
      });
      return stocks.length > 0 ? Math.min(...stocks) : 0;
    };
    return [{ size: 'Kit', stockAO: componentStock('AO'), stockPT: componentStock('PT') }];
  }
  const bySize = new Map<string, { size: string; stockAO: number; stockPT: number }>();
  for (const v of p.variants ?? []) {
    const label = v.size?.trim() || 'Único';
    const entry = bySize.get(label) ?? { size: label, stockAO: 0, stockPT: 0 };
    entry.stockAO += v.stockAO;
    entry.stockPT += v.stockPT;
    bySize.set(label, entry);
  }
  return [...bySize.values()];
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        fontSize: 11,
        fontWeight: 800,
        borderRadius: 6,
        border: `1px solid ${active ? C.black : C.rule}`,
        background: active ? C.black : C.paper,
        color: active ? C.onDarkGold : C.ink,
      }}
    >
      {label}
    </button>
  );
}
