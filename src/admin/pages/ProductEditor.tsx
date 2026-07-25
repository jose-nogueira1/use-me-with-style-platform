import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import {
  adminCreateCategory,
  adminCreateColor,
  adminCreateMerchTag,
  adminCreateProduct,
  adminDeleteProduct,
  adminListCategories,
  adminListColors,
  adminListMerchTags,
  adminListProducts,
  adminUpdateProduct,
  adminUploadProductImage,
  resolveProductImage,
  resolveRef,
  type ApiCategory,
  type ApiColor,
  type ApiMerchTag,
  type ApiProduct,
} from '../../lib/api';
import { PageHeader } from '../components/PageHeader';

// Categories, merchandising tags, and colours are admin-managed CMS
// collections since 2026-07-25 (previously hardcoded options / free text),
// so this editor loads each list from the API and offers inline "+ New"
// creation instead of baked-in constants.

/** Normalizes a Payload relationship ref (id at depth 0, doc at depth 1+)
 * to a string id for form state. */
function refId(ref: string | number | { id?: string | number } | null | undefined): string {
  if (ref === null || ref === undefined) return '';
  if (typeof ref === 'object') return ref.id !== undefined ? String(ref.id) : '';
  return String(ref);
}

type FormState = {
  name: string;
  namePT: string;
  nameEN: string;
  // Read-only in this form -- auto-generated server-side from the product
  // name (2026-07-25 admin request: "user should not be allowed to create
  // them"). Kept in FormState purely to display it, never sent back on
  // save; see handleSave and generateProductSlug in the CMS repo.
  slug: string;
  /** Category id (string form). Empty = not chosen yet. */
  category: string;
  description: string;
  descriptionPT: string;
  descriptionEN: string;
  sizeGuidePT: string;
  sizeGuideEN: string;
  /** Merch tag id (string form). Empty = no badge. */
  tag: string;
  /** Selected colour ids (string form). */
  colorIds: string[];
  sizes: ApiProduct['sizes'];
  priceAOKz: string;
  pricePTEur: string;
  active: boolean;
  availableAO: boolean;
  availablePT: boolean;
};

const EMPTY: FormState = { name: '', namePT: '', nameEN: '', slug: '', category: '', description: '', descriptionPT: '', descriptionEN: '', sizeGuidePT: '', sizeGuideEN: '', tag: '', colorIds: [], sizes: [{ size: 'S', stockAO: 0, stockPT: 0 }], priceAOKz: '', pricePTEur: '', active: false, availableAO: true, availablePT: true };

export function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'novo';
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [existing, setExisting] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiMerchTag[]>([]);
  const [colors, setColors] = useState<ApiColor[]>([]);

  useEffect(() => {
    Promise.all([adminListCategories(), adminListMerchTags(), adminListColors()])
      .then(([cats, tagDocs, colorDocs]) => {
        setCategories(cats);
        setTags(tagDocs);
        setColors(colorDocs);
        // Sensible default for brand-new products: first category.
        if (isNew && cats.length > 0) {
          setForm((f) => (f.category ? f : { ...f, category: String(cats[0].id) }));
        }
      })
      .catch(() => setError("Couldn't load categories/tags/colours from the backend."));
  }, [isNew]);

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
          category: refId(p.category),
          description: p.description ?? '',
          descriptionPT: p.descriptionPT ?? p.description ?? '',
          descriptionEN: p.descriptionEN ?? '',
          sizeGuidePT: p.sizeGuidePT ?? '',
          sizeGuideEN: p.sizeGuideEN ?? '',
          tag: refId(p.tag),
          colorIds: (p.colors ?? []).map((c) => refId(c)).filter(Boolean),
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

  /** Maps a string-form id back to the ORIGINAL id (number under Postgres,
   * string under SQLite) so Payload's relationship validation accepts it. */
  const originalId = (docs: { id: string | number }[], stringId: string): string | number =>
    docs.find((d) => String(d.id) === stringId)?.id ?? stringId;

  const handleSave = async () => {
    if (!form.category) {
      setError('Choose a category before saving.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Partial<ApiProduct> = {
      name: form.namePT || form.name,
      namePT: form.namePT,
      nameEN: form.nameEN,
      // slug intentionally omitted -- auto-generated (create) or preserved
      // as-is (update) server-side, never client-supplied.
      category: originalId(categories, form.category),
      description: form.descriptionPT || form.description,
      descriptionPT: form.descriptionPT,
      descriptionEN: form.descriptionEN,
      sizeGuidePT: form.sizeGuidePT || undefined,
      sizeGuideEN: form.sizeGuideEN || undefined,
      // null (not undefined) so removing a badge actually clears it.
      tag: form.tag ? originalId(tags, form.tag) : null,
      colors: form.colorIds.map((cid) => originalId(colors, cid)),
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

  const handleCreateCategory = async (namePT: string, nameEN: string) => {
    const created = await adminCreateCategory({ namePT, nameEN: nameEN || undefined });
    setCategories((prev) => [...prev, created]);
    set('category', String(created.id));
  };

  const handleCreateTag = async (labelPT: string, labelEN: string) => {
    const created = await adminCreateMerchTag({ labelPT, labelEN: labelEN || undefined });
    setTags((prev) => [...prev, created]);
    set('tag', String(created.id));
  };

  const handleCreateColor = async (name: string, hex?: string) => {
    const created = await adminCreateColor({ name, hex });
    setColors((prev) => [...prev, created]);
    setForm((f) => ({ ...f, colorIds: [...f.colorIds, String(created.id)] }));
  };

  const toggleColor = (colorId: string) =>
    setForm((f) => ({
      ...f,
      colorIds: f.colorIds.includes(colorId) ? f.colorIds.filter((c) => c !== colorId) : [...f.colorIds, colorId],
    }));

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
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Category</div>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
              >
                {form.category === '' && <option value="">Choose…</option>}
                {categories.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.namePT}{c.nameEN && c.nameEN !== c.namePT ? ` / ${c.nameEN}` : ''}
                  </option>
                ))}
              </select>
              <InlineCreate
                buttonLabel="+ New category"
                fields={[{ placeholder: 'Name — Portuguese' }, { placeholder: 'Name — English (optional)' }]}
                onCreate={([pt, en]) => handleCreateCategory(pt, en)}
                onError={() => setError("Couldn't create the category.")}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Merchandising tag</div>
              <select
                value={form.tag}
                onChange={(e) => set('tag', e.target.value)}
                style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
              >
                <option value="">None</option>
                {tags.map((tg) => (
                  <option key={String(tg.id)} value={String(tg.id)}>
                    {tg.labelPT}{tg.labelEN && tg.labelEN !== tg.labelPT ? ` / ${tg.labelEN}` : ''}
                  </option>
                ))}
              </select>
              <InlineCreate
                buttonLabel="+ New tag"
                fields={[{ placeholder: 'Label — Portuguese' }, { placeholder: 'Label — English (optional)' }]}
                onCreate={([pt, en]) => handleCreateTag(pt, en)}
                onError={() => setError("Couldn't create the tag.")}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <ReadOnlyField
              label="Slug"
              value={form.slug || (isNew ? 'Generated automatically on save' : '')}
            />
            <FieldInput label="Angola price (Kz)" value={form.priceAOKz} onChange={(v) => set('priceAOKz', v)} type="number" />
            <FieldInput label="Portugal price (EUR)" value={form.pricePTEur} onChange={(v) => set('pricePTEur', v)} type="number" />
          </div>

          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Colours</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {colors.length === 0 && <span style={{ fontSize: 11, color: C.inkSoft }}>No colours yet — add the first one below.</span>}
              {colors.map((c) => {
                const cid = String(c.id);
                const selected = form.colorIds.includes(cid);
                const swatch = resolveRef(c.swatch);
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => toggleColor(cid)}
                    aria-pressed={selected}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 20,
                      border: `1.5px solid ${selected ? C.gold : C.rule}`,
                      background: selected ? C.tagBg : C.paper,
                      color: selected ? C.goldDeep : C.ink,
                      cursor: 'pointer',
                    }}
                  >
                    {(swatch?.url || c.hex) && (
                      <span
                        aria-hidden
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          flexShrink: 0,
                          border: `1px solid ${C.rule}`,
                          background: swatch?.url ? `center / cover url(${swatch.url})` : c.hex ?? undefined,
                        }}
                      />
                    )}
                    {c.name}
                  </button>
                );
              })}
            </div>
            <InlineCreateColor
              onCreate={handleCreateColor}
              onError={() => setError("Couldn't create the colour.")}
            />
            <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>
              Pattern/multicolour fabrics: create the colour here without a hex, then upload a swatch image on the colour itself in the CMS admin.
            </div>
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

/** Tiny expandable "+ New …" row used for categories and tags: a toggle
 * button that reveals one or two text inputs and a create button. First
 * field is required; the rest are optional. */
function InlineCreate({
  buttonLabel,
  fields,
  onCreate,
  onError,
}: {
  buttonLabel: string;
  fields: { placeholder: string }[];
  onCreate: (values: string[]) => Promise<void>;
  onError: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<string[]>(fields.map(() => ''));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!values[0].trim()) return;
    setBusy(true);
    try {
      await onCreate(values.map((v) => v.trim()));
      setValues(fields.map(() => ''));
      setOpen(false);
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: C.goldDeep, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
        {buttonLabel}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {fields.map((f, i) => (
        <input
          key={f.placeholder}
          type="text"
          value={values[i]}
          placeholder={f.placeholder}
          onChange={(e) => setValues((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
          style={{ flex: '1 1 120px', minWidth: 0, padding: '8px 10px', fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
        />
      ))}
      <button type="button" onClick={submit} disabled={busy || !values[0].trim()} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 800, borderRadius: 6, background: C.black, color: C.onDarkGold, border: 'none', cursor: 'pointer' }}>
        {busy ? '…' : 'Add'}
      </button>
      <button type="button" onClick={() => setOpen(false)} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 800, borderRadius: 6, background: 'transparent', color: C.inkSoft, border: `1px solid ${C.rule}`, cursor: 'pointer' }}>
        Cancel
      </button>
    </div>
  );
}

/** "+ New colour" row: name + hex picker, with a "pattern" escape hatch
 * that skips the hex (for fabrics a single colour value can't represent --
 * a swatch image can then be uploaded on the colour in the CMS admin). */
function InlineCreateColor({ onCreate, onError }: { onCreate: (name: string, hex?: string) => Promise<void>; onError: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#C8A96A');
  const [noHex, setNoHex] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onCreate(name.trim(), noHex ? undefined : hex);
      setName('');
      setNoHex(false);
      setOpen(false);
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ marginTop: 8, fontSize: 10, fontWeight: 800, color: C.goldDeep, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'block' }}>
        + New colour
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="text"
        value={name}
        placeholder='Colour name, e.g. "Verde Oliva"'
        onChange={(e) => setName(e.target.value)}
        style={{ flex: '1 1 160px', minWidth: 0, padding: '8px 10px', fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
      />
      {!noHex && (
        <input aria-label="Colour value" type="color" value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 36, height: 32, padding: 2, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, cursor: 'pointer' }} />
      )}
      <label style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 10, fontWeight: 700, color: C.inkSoft }}>
        <input type="checkbox" checked={noHex} onChange={(e) => setNoHex(e.target.checked)} />
        Pattern (no single colour)
      </label>
      <button type="button" onClick={submit} disabled={busy || !name.trim()} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 800, borderRadius: 6, background: C.black, color: C.onDarkGold, border: 'none', cursor: 'pointer' }}>
        {busy ? '…' : 'Add'}
      </button>
      <button type="button" onClick={() => setOpen(false)} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 800, borderRadius: 6, background: 'transparent', color: C.inkSoft, border: `1px solid ${C.rule}`, cursor: 'pointer' }}>
        Cancel
      </button>
    </div>
  );
}
