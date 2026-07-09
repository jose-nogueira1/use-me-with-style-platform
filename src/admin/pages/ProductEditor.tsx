import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { adminCreateProduct, adminListProducts, adminUpdateProduct, type ApiProduct } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';

const CATEGORIES: ApiProduct['category'][] = ['vestidos', 'tops', 'leggings', 'conjuntos'];
const CATEGORY_LABEL: Record<ApiProduct['category'], string> = { vestidos: 'Dresses', tops: 'Tops', leggings: 'Leggings', conjuntos: 'Sets' };

type FormState = {
  name: string;
  slug: string;
  category: ApiProduct['category'];
  description: string;
  priceAOKz: string;
  pricePTEur: string;
  active: boolean;
};

const EMPTY: FormState = { name: '', slug: '', category: 'vestidos', description: '', priceAOKz: '', pricePTEur: '', active: false };

export function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'novo';
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [existing, setExisting] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    adminListProducts()
      .then((products) => {
        const p = products.find((x) => x.id === id);
        if (!p) {
          setError('Product not found.');
          return;
        }
        setExisting(p);
        setForm({
          name: p.name,
          slug: p.slug,
          category: p.category,
          description: p.description ?? '',
          priceAOKz: String(p.priceAOKz),
          pricePTEur: String(p.pricePTEur),
          active: p.active,
        });
      })
      .catch(() => setError("Couldn't connect to the backend."))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload: Partial<ApiProduct> = {
      name: form.name,
      slug: form.slug,
      category: form.category,
      description: form.description,
      priceAOKz: Number(form.priceAOKz) || 0,
      pricePTEur: Number(form.pricePTEur) || 0,
      active: form.active,
    };
    try {
      if (isNew) {
        const created = await adminCreateProduct(payload);
        navigate(`/admin/produtos/${created.id}`);
      } else if (existing) {
        await adminUpdateProduct(existing.id, payload);
      }
    } catch {
      setError("Couldn't save. Make sure the backend is running.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>Loading…</div>;

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={isNew ? 'Products / Add product' : `Products / ${form.name}`}
        title={isNew ? 'Create catalogue item' : form.name}
        subtitle="Enter everything needed to sell a piece before final photography arrives."
        cta={isNew ? 'Publish product' : 'Save changes'}
        onCta={handleSave}
      />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'flex-start' }} className="ump-admin-orders-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
          <div
            style={{
              height: 280,
              borderRadius: 8,
              border: `1px solid ${C.goldDeep}`,
              background: C.subtleBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: C.goldDeep,
              textAlign: 'center',
              padding: 16,
            }}
          >
            {existing?.images?.length ? (
              <img src={existing.images[0].image.url} alt={existing.images[0].image.alt ?? form.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              'Client photo pending'
            )}
          </div>
          <button style={{ width: '100%', marginTop: 12, padding: 12, background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 6, fontSize: 11, fontWeight: 800, color: C.ink }}>
            Add photos
          </button>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <FieldInput label="Product name" value={form.name} onChange={(v) => set('name', v)} />
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Category</div>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as ApiProduct['category'])}
                style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Status</div>
              <select
                value={form.active ? 'active' : 'draft'}
                onChange={(e) => set('active', e.target.value === 'active')}
                style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <FieldInput label="Angola price (Kz)" value={form.priceAOKz} onChange={(v) => set('priceAOKz', v)} type="number" />
            <FieldInput label="Portugal price (EUR)" value={form.pricePTEur} onChange={(v) => set('pricePTEur', v)} type="number" />
          </div>

          {existing && existing.sizes.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Stock by size</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {existing.sizes.map((s) => (
                  <div key={s.size} style={{ padding: '10px 12px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}`, fontSize: 11, fontWeight: 800, color: C.ink }}>
                    {s.size} · AO {s.stockAO} / PT {s.stockPT}
                  </div>
                ))}
              </div>
            </div>
          )}

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Description placeholder</div>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Soft launch copy until client approves final product descriptions. Include fit, care, fabric, and styling notes."
              style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
            />
          </label>

          <div style={{ fontSize: 10, color: C.inkSoft }}>
            Full colour and size/stock-by-market editing is available directly in the Payload admin (localhost:3000/admin) --
            this view covers the essential Phase 1 fields.
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: 12, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, alignSelf: 'flex-start', minWidth: 160 }}
          >
            {saving ? '…' : isNew ? 'Publish product' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
      />
    </label>
  );
}
