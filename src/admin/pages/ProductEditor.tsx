import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminListCategories,
  adminListColors,
  adminListMerchTags,
  adminListProducts,
  adminListSizeGuides,
  adminUpdateProduct,
  adminUploadProductImage,
  colorLabel,
  refId,
  resolveProductImage,
  resolveRef,
  type ApiCategory,
  type ApiColor,
  type ApiMerchTag,
  type ApiProduct,
  type ApiSizeGuide,
  type ApiVariant,
} from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';

// Catalogue taxonomies are managed in the Product settings page
// (/admin/definicoes-produto) since 2026-07-25; this editor only PICKS
// from those lists. Stock is variant-level (colour x size): the admin
// toggles which colours and sizes the piece comes in, and fills stock in
// the resulting matrix -- rows are colours, columns are sizes, one AO/PT
// input pair per cell.

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/** Stock cell key: `${colorId}|${size}`. */
const cellKey = (colorId: string, size: string) => `${colorId}|${size}`;

type StockCell = { ao: number; pt: number };

type FormState = {
  name: string;
  namePT: string;
  nameEN: string;
  // Read-only in this form -- auto-generated server-side from the product
  // name (2026-07-25 admin request). Kept in FormState purely to display
  // it, never sent back on save.
  slug: string;
  /** Category id (string form). Empty = not chosen yet. */
  category: string;
  description: string;
  descriptionPT: string;
  descriptionEN: string;
  /** Size guide id (string form). Empty = none. */
  sizeGuide: string;
  fitNotePT: string;
  fitNoteEN: string;
  /** Merch tag id (string form). Empty = no badge. */
  tag: string;
  /** Colours this piece comes in (matrix rows, in display order). */
  colorIds: string[];
  /** Sizes this piece comes in (matrix columns). */
  sizes: string[];
  /** Per colour+size stock; missing cells default to 0/0. */
  stock: Record<string, StockCell>;
  priceAOKz: string;
  pricePTEur: string;
  shippingWeightGrams: string;
  /** Sale pricing (2026-07-25, discounts phase 1) -- all optional; blank
   * means "no sale price for this market" / "no start/end restriction". */
  saleAOKz: string;
  salePTEur: string;
  saleStartDate: string;
  saleEndDate: string;
  active: boolean;
  availableAO: boolean;
  availablePT: boolean;
};

const EMPTY: FormState = { name: '', namePT: '', nameEN: '', slug: '', category: '', description: '', descriptionPT: '', descriptionEN: '', sizeGuide: '', fitNotePT: '', fitNoteEN: '', tag: '', colorIds: [], sizes: ['S', 'M', 'L'], stock: {}, priceAOKz: '', pricePTEur: '', shippingWeightGrams: '500', saleAOKz: '', salePTEur: '', saleStartDate: '', saleEndDate: '', active: false, availableAO: true, availablePT: true };

/** Payload date fields round-trip as full ISO datetimes; the admin form uses
 * a plain <input type="date">, which needs just the YYYY-MM-DD portion. */
function toDateInputValue(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

function formFromVariants(variants: ApiVariant[]): Pick<FormState, 'colorIds' | 'sizes' | 'stock'> {
  const colorIds: string[] = [];
  const sizes: string[] = [];
  const stock: Record<string, StockCell> = {};
  for (const variant of variants) {
    const colorId = refId(variant.color);
    if (colorId && !colorIds.includes(colorId)) colorIds.push(colorId);
    if (!sizes.includes(variant.size)) sizes.push(variant.size);
    stock[cellKey(colorId, variant.size)] = { ao: variant.stockAO, pt: variant.stockPT };
  }
  sizes.sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b));
  return { colorIds, sizes, stock };
}

export function ProductEditor() {
  const { lang } = useApp();
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
  const [sizeGuides, setSizeGuides] = useState<ApiSizeGuide[]>([]);

  useEffect(() => {
    Promise.all([adminListCategories(), adminListMerchTags(), adminListColors(), adminListSizeGuides()])
      .then(([cats, tagDocs, colorDocs, guideDocs]) => {
        setCategories(cats);
        setTags(tagDocs);
        setColors(colorDocs);
        setSizeGuides(guideDocs);
        if (isNew && cats.length > 0) {
          setForm((f) => (f.category ? f : { ...f, category: String(cats[0].id) }));
        }
      })
      .catch(() => setError(t('couldntLoadTaxonomies', lang)));
  }, [isNew, lang]);

  useEffect(() => {
    if (isNew) return;
    adminListProducts()
      .then((products) => {
        const p = products.find((x) => String(x.id) === id);
        if (!p) {
          setError(t('productNotFound', lang));
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
          sizeGuide: refId(p.sizeGuide),
          fitNotePT: p.fitNotePT ?? '',
          fitNoteEN: p.fitNoteEN ?? '',
          tag: refId(p.tag),
          ...formFromVariants(p.variants ?? []),
          priceAOKz: String(p.priceAOKz),
          pricePTEur: String(p.pricePTEur),
          shippingWeightGrams: String(p.shippingWeightGrams ?? 500),
          saleAOKz: p.saleAOKz != null ? String(p.saleAOKz) : '',
          salePTEur: p.salePTEur != null ? String(p.salePTEur) : '',
          saleStartDate: toDateInputValue(p.saleStartDate),
          saleEndDate: toDateInputValue(p.saleEndDate),
          active: p.active,
          availableAO: p.availableAO,
          availablePT: p.availablePT,
        });
      })
      .catch(() => setError(t('couldntConnectBackend', lang)))
      .finally(() => setLoading(false));
  }, [id, isNew, lang]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  /** Maps a string-form id back to the ORIGINAL id (number under Postgres,
   * string under SQLite) so Payload's relationship validation accepts it. */
  const originalId = (docs: { id: string | number }[], stringId: string): string | number =>
    docs.find((d) => String(d.id) === stringId)?.id ?? stringId;

  const toggleColor = (colorId: string) =>
    setForm((f) => ({
      ...f,
      colorIds: f.colorIds.includes(colorId) ? f.colorIds.filter((c) => c !== colorId) : [...f.colorIds, colorId],
    }));

  const toggleSize = (size: string) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size)
        ? f.sizes.filter((s) => s !== size)
        : [...f.sizes, size].sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b)),
    }));

  const setStock = (colorId: string, size: string, market: 'ao' | 'pt', value: number) =>
    setForm((f) => {
      const key = cellKey(colorId, size);
      const cell = f.stock[key] ?? { ao: 0, pt: 0 };
      return { ...f, stock: { ...f.stock, [key]: { ...cell, [market]: value } } };
    });

  const handleSave = async () => {
    if (!form.category) {
      setError(t('chooseCategoryError', lang));
      return;
    }
    if (form.colorIds.length === 0 || form.sizes.length === 0) {
      setError(t('pickColourSizeError', lang));
      return;
    }
    setSaving(true);
    setError(null);
    const variants = form.colorIds.flatMap((colorId) =>
      form.sizes.map((size) => {
        const cell = form.stock[cellKey(colorId, size)] ?? { ao: 0, pt: 0 };
        return { color: originalId(colors, colorId), size, stockAO: cell.ao, stockPT: cell.pt };
      }),
    );
    const payload: Partial<ApiProduct> = {
      name: form.namePT || form.name,
      namePT: form.namePT,
      nameEN: form.nameEN,
      // slug intentionally omitted -- server-generated, never client-supplied.
      category: originalId(categories, form.category),
      description: form.descriptionPT || form.description,
      descriptionPT: form.descriptionPT,
      descriptionEN: form.descriptionEN,
      sizeGuide: form.sizeGuide ? originalId(sizeGuides, form.sizeGuide) : null,
      fitNotePT: form.fitNotePT || undefined,
      fitNoteEN: form.fitNoteEN || undefined,
      // null (not undefined) so removing a badge actually clears it.
      tag: form.tag ? originalId(tags, form.tag) : null,
      variants,
      priceAOKz: Number(form.priceAOKz) || 0,
      pricePTEur: Number(form.pricePTEur) || 0,
      shippingWeightGrams: Math.max(1, Number(form.shippingWeightGrams) || 500),
      // null (not undefined) so clearing a sale price actually removes it --
      // same pattern as sizeGuide/tag above.
      saleAOKz: form.saleAOKz.trim() ? Number(form.saleAOKz) : null,
      salePTEur: form.salePTEur.trim() ? Number(form.salePTEur) : null,
      saleStartDate: form.saleStartDate || null,
      saleEndDate: form.saleEndDate || null,
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
      setError(t('couldntSaveBackend', lang));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!window.confirm(t('deleteProductConfirm', lang, { name: form.name }))) return;
    setSaving(true);
    setError(null);
    try {
      await adminDeleteProduct(existing.id);
      navigate('/admin/produtos');
    } catch {
      setError(t('couldntDeleteProduct', lang));
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
      setError(t('couldntUploadImage', lang));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>;

  const selectStyle: React.CSSProperties = { width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={isNew ? t('crumbAddProduct', lang) : t('crumbEditProduct', lang, { name: form.name })}
        title={isNew ? t('createCatalogueItem', lang) : form.name}
        subtitle={t('enterEverythingSubtitle', lang)}
        cta={isNew ? t('publishProduct', lang) : t('saveChanges', lang)}
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
              t('clientPhotoPending', lang)
            )}
          </div>
          <label style={{ display: 'block', width: '100%', marginTop: 12, padding: 12, background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 6, fontSize: 11, fontWeight: 800, color: C.ink, textAlign: 'center', cursor: 'pointer' }}>
            {t('addPhotos', lang)}
            <input type="file" accept="image/*" hidden onChange={(e) => void handleImageUpload(e.target.files?.[0])} />
          </label>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <FieldInput label={t('productNamePT', lang)} value={form.namePT} onChange={(v) => set('namePT', v)} />
            <FieldInput label={t('productNameEN', lang)} value={form.nameEN} onChange={(v) => set('nameEN', v)} />
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('statusLabel', lang)}</div>
              <select value={form.active ? 'active' : 'draft'} onChange={(e) => set('active', e.target.value === 'active')} style={selectStyle}>
                <option value="draft">{t('draftOption', lang)}</option>
                <option value="active">{t('activeOption', lang)}</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('categoryLabel', lang)}</div>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} style={selectStyle}>
                {form.category === '' && <option value="">{t('chooseEllipsis', lang)}</option>}
                {categories.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.namePT}{c.nameEN && c.nameEN !== c.namePT ? ` / ${c.nameEN}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('merchTagLabel', lang)}</div>
              <select value={form.tag} onChange={(e) => set('tag', e.target.value)} style={selectStyle}>
                <option value="">{t('noneOption', lang)}</option>
                {tags.map((tg) => (
                  <option key={String(tg.id)} value={String(tg.id)}>
                    {tg.labelPT}{tg.labelEN && tg.labelEN !== tg.labelPT ? ` / ${tg.labelEN}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('sizeGuideLabel', lang)}</div>
              <select value={form.sizeGuide} onChange={(e) => set('sizeGuide', e.target.value)} style={selectStyle}>
                <option value="">{t('noneOption', lang)}</option>
                {sizeGuides.map((g) => (
                  <option key={String(g.id)} value={String(g.id)}>{g.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ fontSize: 10, color: C.inkSoft, marginTop: -8 }}>
            {t('taxonomyManagedNotePrefix', lang)} <Link to="/admin/definicoes?tab=products" style={{ color: C.goldDeep, fontWeight: 800 }}>{t('settingsProductsLink', lang)}</Link>.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <ReadOnlyField label={t('slugLabel', lang)} value={form.slug || (isNew ? t('generatedAutomatically', lang) : '')} />
            <FieldInput label={t('angolaPriceKz', lang)} value={form.priceAOKz} onChange={(v) => set('priceAOKz', v)} type="number" />
            <FieldInput label={t('portugalPriceEur', lang)} value={form.pricePTEur} onChange={(v) => set('pricePTEur', v)} type="number" />
            <FieldInput label={t('shippingWeightGrams', lang)} value={form.shippingWeightGrams} onChange={(v) => set('shippingWeightGrams', v)} type="number" />
          </div>

          {/* Sale pricing (2026-07-25, discounts phase 1): optional, mirrors
              the regular price fields above. Leave a market's field blank to
              not discount that market; leave both dates blank for the sale
              to run indefinitely as soon as a sale price is set. */}
          <div style={{ marginTop: -4 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('salePricingOptional', lang)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
              <FieldInput label={t('saleAngolaKz', lang)} value={form.saleAOKz} onChange={(v) => set('saleAOKz', v)} type="number" />
              <FieldInput label={t('salePortugalEur', lang)} value={form.salePTEur} onChange={(v) => set('salePTEur', v)} type="number" />
              <FieldInput label={t('saleStart', lang)} value={form.saleStartDate} onChange={(v) => set('saleStartDate', v)} type="date" />
              <FieldInput label={t('saleEnd', lang)} value={form.saleEndDate} onChange={(v) => set('saleEndDate', v)} type="date" />
            </div>
          </div>

          {/* ---- Variant matrix: colours x sizes, stock per cell ---- */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('coloursLabel', lang)}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {colors.length === 0 && <span style={{ fontSize: 11, color: C.inkSoft }}>{t('noColoursYet', lang)}</span>}
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
                    {hasSwatch({ hex: c.hex, hex2: c.hex2, swatchUrl: swatch?.url }) && (
                      <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, border: `1px solid ${C.rule}`, background: swatchBackground({ hex: c.hex, hex2: c.hex2, swatchUrl: swatch?.url }) }} />
                    )}
                    {colorLabel(c)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('sizesLabel', lang)}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_SIZES.map((size) => {
                const selected = form.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    aria-pressed={selected}
                    style={{
                      minWidth: 40,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 6,
                      border: `1.5px solid ${selected ? C.gold : C.rule}`,
                      background: selected ? C.tagBg : C.paper,
                      color: selected ? C.goldDeep : C.ink,
                      cursor: 'pointer',
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {form.colorIds.length > 0 && form.sizes.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>
                {t('stockByColourSize', lang)} <span style={{ fontWeight: 700, color: C.inkSoft }}>{t('aoPtPerCell', lang)}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '6px 10px 6px 0', fontSize: 9, fontWeight: 800, color: C.goldDeep }}>{t('colourTableHeader', lang)}</th>
                      {form.sizes.map((size) => (
                        <th key={size} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 800, color: C.ink }}>{size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.colorIds.map((colorId) => {
                      const color = colors.find((c) => String(c.id) === colorId);
                      const swatch = resolveRef(color?.swatch);
                      return (
                        <tr key={colorId} style={{ borderTop: `1px solid ${C.ruleLight}` }}>
                          <td style={{ padding: '8px 10px 8px 0', fontWeight: 800, color: C.ink, whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {hasSwatch({ hex: color?.hex, hex2: color?.hex2, swatchUrl: swatch?.url }) && (
                                <span aria-hidden style={{ width: 11, height: 11, borderRadius: '50%', border: `1px solid ${C.rule}`, background: swatchBackground({ hex: color?.hex, hex2: color?.hex2, swatchUrl: swatch?.url }) }} />
                              )}
                              {color ? colorLabel(color) : '?'}
                            </span>
                          </td>
                          {form.sizes.map((size) => {
                            const cell = form.stock[cellKey(colorId, size)] ?? { ao: 0, pt: 0 };
                            return (
                              <td key={size} style={{ padding: '6px 8px' }}>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                  <input
                                    aria-label={t('stockAriaAO', lang, { colour: color ? colorLabel(color) : colorId, size })}
                                    type="number"
                                    min="0"
                                    value={cell.ao}
                                    onChange={(e) => setStock(colorId, size, 'ao', Number(e.target.value))}
                                    style={{ width: 52, padding: '6px 6px', fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
                                  />
                                  <input
                                    aria-label={t('stockAriaPT', lang, { colour: color ? colorLabel(color) : colorId, size })}
                                    type="number"
                                    min="0"
                                    value={cell.pt}
                                    onChange={(e) => setStock(colorId, size, 'pt', Number(e.target.value))}
                                    style={{ width: 52, padding: '6px 6px', fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <CheckField label={t('publishedLabel', lang)} checked={form.active} onChange={(v) => set('active', v)} />
            <CheckField label={t('availableAngola', lang)} checked={form.availableAO} onChange={(v) => set('availableAO', v)} />
            <CheckField label={t('availablePortugal', lang)} checked={form.availablePT} onChange={(v) => set('availablePT', v)} />
          </div>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('descriptionPTLabel', lang)}</div>
            <textarea
              value={form.descriptionPT}
              onChange={(e) => set('descriptionPT', e.target.value)}
              rows={3}
              placeholder={t('descriptionPlaceholder', lang)}
              style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
            />
          </label>

          <label style={{ display: 'block' }}><div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('descriptionENLabel', lang)}</div><textarea value={form.descriptionEN} onChange={(e) => set('descriptionEN', e.target.value)} rows={3} style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }} /></label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('fitNotePTLabel', lang)}</div>
              <textarea
                value={form.fitNotePT}
                onChange={(e) => set('fitNotePT', e.target.value)}
                rows={2}
                placeholder='Optional, shown under the size chart. e.g. "Veste pequeno, recomendamos um tamanho acima."'
                style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
              />
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('fitNoteENLabel', lang)}</div>
              <textarea
                value={form.fitNoteEN}
                onChange={(e) => set('fitNoteEN', e.target.value)}
                rows={2}
                placeholder='e.g. "Runs small, we recommend sizing up."'
                style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: 12, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, alignSelf: 'flex-start', minWidth: 160 }}
            >
              {saving ? '…' : isNew ? t('publishProduct', lang) : t('saveChanges', lang)}
            </button>
            {!isNew && existing && (
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{ padding: 12, background: 'transparent', color: '#B95545', border: '1px solid #E1B3AA', fontSize: 11, fontWeight: 800, borderRadius: 6, alignSelf: 'flex-start' }}
              >
                {t('deleteProduct', lang)}
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
