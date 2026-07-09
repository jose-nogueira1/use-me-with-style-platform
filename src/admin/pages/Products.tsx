import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { C, F } from '../../theme';
import { adminListProducts, type ApiProduct } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';

export function Products() {
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'low' | 'photo'>('all');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    adminListProducts()
      .then(setProducts)
      .catch(() => setError(true));
  }, []);

  const isLowStock = (p: ApiProduct) => p.sizes.some((s) => s.stockAO + s.stockPT <= 2);
  const hasPhoto = (p: ApiProduct) => (p.images?.length ?? 0) > 0;

  const filtered = (products ?? []).filter((p) => {
    if (filter === 'active') return p.active;
    if (filter === 'draft') return !p.active;
    if (filter === 'low') return isLowStock(p);
    if (filter === 'photo') return !hasPhoto(p);
    return true;
  });

  const counts = {
    all: products?.length ?? 0,
    active: products?.filter((p) => p.active).length ?? 0,
    draft: products?.filter((p) => !p.active).length ?? 0,
    low: products?.filter(isLowStock).length ?? 0,
    photo: products?.filter((p) => !hasPhoto(p)).length ?? 0,
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow="Products"
        title="Catalogue control"
        subtitle="Manual product entry, stock by size, prices for both markets, and publish state."
        cta="Add product"
        onCta={() => navigate('/admin/produtos/novo')}
      />

      <div style={{ padding: '20px 28px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FilterPill label={`All ${counts.all}`} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterPill label={`Active ${counts.active}`} active={filter === 'active'} onClick={() => setFilter('active')} />
        <FilterPill label={`Draft ${counts.draft}`} active={filter === 'draft'} onClick={() => setFilter('draft')} />
        <FilterPill label={`Low stock ${counts.low}`} active={filter === 'low'} onClick={() => setFilter('low')} />
        <FilterPill label={`Photo pending ${counts.photo}`} active={filter === 'photo'} onClick={() => setFilter('photo')} />
      </div>

      {error && <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>Couldn't connect to the backend.</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {filtered.map((p) => (
          <Link key={p.id} to={`/admin/produtos/${p.id}`} style={{ textDecoration: 'none', display: 'block', background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
            <div style={{ height: 110, borderRadius: 6, background: '#F1EADF', border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep }}>{hasPhoto(p) ? '' : 'Photo pending'}</span>
              {hasPhoto(p) && <img src={p.images![0].image.url} alt={p.images![0].image.alt ?? p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />}
            </div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 12 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>
              AO Kz {p.priceAOKz.toLocaleString('en-US')} / PT EUR {p.pricePTEur}.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {p.sizes.map((s) => {
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
