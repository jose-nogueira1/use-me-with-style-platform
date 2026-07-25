import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { adminCreateProduct, adminDeleteProduct, adminListProducts, adminUpdateProduct, adminUploadProductImage, resolveProductImage, type ApiProduct } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';

const CATEGORIES: ApiProduct['category'][] = ['vestidos', 'tops', 'leggings', 'conjuntos'];
const CATEGORY_LABEL: Record<ApiProduct['category'], string> = { vestidos: 'Dresses', tops: 'Tops', leggings: 'Leggings', conjuntos: 'Sets' };

type FormState = {
  name: string;
  namePT: string;
  nameEN: string;
  // Read-only in this form -- auto-generated server-side from the product
  // name (2026-07-25 admin request: "user should not be allowed to create
  // them"). Kept in FormState purely to display it, never sent back on
  // save; see handleSave and generateProductSlug in the CMS repo.
  slug: string;
  category: ApiProduct['category'];
  description: string;
  descriptionPT: string;
  descriptionEN: string;
  sizeGuidePT: string;
  sizeGuideEN: string;
  tag: string;
  colors: string;
  sizes: ApiProduct['sizes'];
  priceAOKz: string;
  pricePTEur: string;
  active: boolean;
  availableAO: boolean;
  availablePT: boolean;
};

const EMPTY: FormState = { name: '', namePT: '', nameEN: '', slug: '', category: 'vestidos', description: '', descriptionPT: '', descriptionEN: '', sizeGuidePT: '', sizeGuideEN: '', tag: '', colors: '', sizes: [{ size: 'S', stockAO: 0, stockPT: 0 }], priceAOKz: '', pricePTEur: '', active: false, availableAO: true, availablePT: true };

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
        const p = products.find((x) => String(x.id) === id);
        if (!p) {
          setError('Product not found.');
          return;
        }
        setExisting(p);
        setForm({
          name: p.name,
          namePT: p.namePT ?? p.name,
          nameEN: p.nameEN ?? p.name,
          slug: p.slug,
          category: p.category,
          description: p.description ?? '',
          descriptionPT: p.descriptionPT ?? p.description ?? '',
          descriptionEN: p.descriptionEN ?? '',
          sizeGuidePT: p.sizeGuidePT ?? '',
          sizeGuideEN: p.sizeGuideEN ?? '',
          tag: p.tag ?? '',
          colors: p.colors.map((c) => c.color).join(', '),
          sizes: p.sizes,
          priceAOKz: String(p.priceAOKz),
          pricePTEur: String(p.pricePTEur),
          active: p.active,
          availableAO: p.availableAO,
          availablePT: p.availablePT,
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
      name: form.namePT || form.name,
      namePT: form.namePT,
      nameEN: form.nameEN,
      // slug intentionally omitted -- auto-generated (create) or preserved
      // as-is (update) server-side, never client-supplied.
      category: form.category,
      description: form.descriptionPT || form.description,
      descriptionPT: form.descriptionPT,
      descriptionEN: form.descriptionEN,
      sizeGuidePT: form.sizeGuidePT || undefined,
      sizeGuideEN: form.sizeGuideEN || undefined,
      tag: form.tag || undefined,
      colors: form.colors.split(',').map((color) => color.trim()).filter(Boolean).map((color) => ({ color })),
      sizes: form.sizes,
      priceAOKz: Number(form.priceAOKz) || 0,
      pricePTEur: Number(form.pricePTEur) || 0,
      active: form.active,
      availableAO: form.availableAO,
      availablePT: form.availablePT,
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

  const handleDelete = async () => {
    if (!existing) return;
    if (!window.confirm(`Delete "${form.name}"? This can't be undone.`)) return;
    setSaving(true);
    setError(null);
    try {
      await adminDeleteProduct(existing.id);
      navigate('/admin/produtos');
    } catch {
      setError("Couldn't delete this product.");
      setSaving(false);
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file || !existing) return;
    setSaving(true);
    setError(null);
    try {
      const media = await adminUploadProductImage(file, form.namePT || form.name || file.name);
      const images = [
        ...(existing.images ?? []).map(({ image }) => ({ image: typeof image === 'object' ? image.id! : image })),
        { image: media.id },
      ];
      const updated = await adminUpdateProduct(existing.id, { images });
      setExisting(updated);
    } catch {
      setError("Couldn't upload the image.");
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
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16, minWidth: 0 }}>
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
              <img src={resolveProductImage(existing.images[0].image).url} alt={resolveProductImage(existing.images[0].image).alt ?? form.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              'Client photo pending'
            )}
          </div>
          <label style={{ display: 'block', width: '100%', marginTop: 12, padding: 12, background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 6, fontSize: 11, fontWeight: 800, color: C.ink, textAlign: 'center', cursor: 'pointer' }}>
            Add photos
            <input type="file" accept="image/*" hidden onChange={(e) => void handleImageUpload(e.target.files?.[0])} />
          </label>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <FieldInput label="Product name — Portuguese" value={form.namePT} onChange={(v) => set('namePT', v)} />
            <FieldInput label="Product name — English" value={form.nameEN} onChange={(v) => set('nameEN', v)} />
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <ReadOnlyField
              label="Slug"
              value={form.slug || (isNew ? 'Generated automatically on save' : '')}
            />
            <FieldInput label="Angola price (Kz)" value={form.priceAOKz} onChange={(v) => set('priceAOKz', v)} type="number" />
            <FieldInput label="Portugal price (EUR)" value={form.pricePTEur} onChange={(v) => set('pricePTEur', v)} type="number" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <FieldInput label="Colours (comma separated)" value={form.colors} onChange={(v) => set('colors', v)} />
            <label><div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Merchandising tag</div><select value={form.tag} onChange={(e) => set('tag', e.target.value)} style={{ width: '100%', padding: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}><option value="">None</option><option value="NOVIDADE">Novidade</option><option value="BESTSELLER">Bestseller</option><option value="QUASE ESGOTADO">Quase esgotado</option></select></label>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <CheckField label="Published" checked={form.active} onChange={(v) => set('active', v)} />
            <CheckField label="Available in Angola" checked={form.availableAO} onChange={(v) => set('availableAO', v)} />
            <CheckField label="Available in Portugal" checked={form.availablePT} onChange={(v) => set('availablePT', v)} />
          </div>

          {form.sizes.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Stock by size</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {form.sizes.map((s, index) => (
                  <div key={`${s.size}-${index}`} style={{ padding: '10px 12px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}`, fontSize: 11, fontWeight: 800, color: C.ink, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select value={s.size} onChange={(e) => set('sizes', form.sizes.map((row, i) => i === index ? { ...row, size: e.target.value } : row))}>{['XS','S','M','L','XL'].map((size) => <option key={size}>{size}</option>)}</select>
                    AO <input aria-label={`${s.size} Angola stock`} type="number" min="0" value={s.stockAO} onChange={(e) => set('sizes', form.sizes.map((row, i) => i === index ? { ...row, stockAO: Number(e.target.value) } : row))} style={{ width: 55 }} />
                    PT <input aria-label={`${s.size} Portugal stock`} type="number" min="0" value={s.stockPT} onChange={(e) => set('sizes', form.sizes.map((row, i) => i === index ? { ...row, stockPT: Number(e.target.value) } : row))} style={{ width: 55 }} />
                    <button type="button" onClick={() => set('sizes', form.sizes.filter((_, i) => i !== index))}>×</button>
                  </div>
                ))}
                <button type="button" onClick={() => set('sizes', [...form.sizes, { size: 'S', stockAO: 0, stockPT: 0 }])}>+ Add size</button>
              </div>
            </div>
          )}

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Description — Portuguese</div>
            <textarea
              value={form.descriptionPT}
              onChange={(e) => set('descriptionPT', e.target.value)}
              rows={3}
              placeholder="Soft launch copy until client approves final product descriptions. Include fit, care, fabric, and styling notes."
              style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
            />
          </label>

          <label style={{ display: 'block' }}><div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Description — English</div><textarea value={form.descriptionEN} onChange={(e) => set('descriptionEN', e.target.value)} rows={3} style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }} /></label>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Size guide — Portuguese</div>
            <textarea
              value={form.sizeGuidePT}
              onChange={(e) => set('sizeGuidePT', e.target.value)}
              rows={3}
              placeholder="e.g. S: busto 82cm, cintura 64cm, anca 90cm. M: busto 86cm…"
              style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
            />
          </label>

          <label style={{ display: 'block' }}><div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Size guide — English</div><textarea value={form.sizeGuideEN} onChange={(e) => set('sizeGuideEN', e.target.value)} rows={3} placeholder="e.g. S: bust 32in, waist 25in, hip 35in. M: bust 34in…" style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }} /></label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: 12, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, alignSelf: 'flex-start', minWidth: 160 }}
            >
              {saving ? '…' : isNew ? 'Publish product' : 'Save changes'}
            </button>
            {!isNew && existing && (
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{ padding: 12, background: 'transparent', color: '#B95545', border: '1px solid #E1B3AA', fontSize: 11, fontWeight: 800, borderRadius: 6, alignSelf: 'flex-start' }}
              >
                Delete product
              </button>
            )}
          </div>
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

// Same visual shell as FieldInput, but genuinely non-editable (disabled
// input, no onChange) -- used for the slug, which is server-generated and
// never client-writable (2026-07-25 admin request).
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <input
        type="text"
        value={value}
        disabled
        style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.ruleLight, color: C.inkSoft, cursor: 'not-allowed' }}
      />
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 11, fontWeight: 800, color: C.ink }}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
