import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
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
import { navigateWithToast } from '../lib/toastNavigation';
import { useDirty } from '../lib/useDirty';
import { t } from '../i18n';
import { buildProductImageAlt } from '../../lib/productImageAlt';
import { imageUploadGuidance, validateImageUpload } from '../../lib/imageUpload';

// Catalogue taxonomies are managed in the Product settings page
// (/admin/definicoes-produto) since 2026-07-25; this editor only PICKS
// from those lists. Stock is variant-level (colour x size): the admin
// toggles which colours and sizes the piece comes in, and fills stock in
// the resulting matrix -- rows are colours, columns are sizes, one AO/PT
// input pair per cell.

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/** Stock cell key: `${colorId}|${size}`. */
const cellKey = (colorId: string, size: string) => `${colorId}|${size}`;

type StockCell = { ao: number; pt: number; variantId?: string };
type SpecificationForm = { labelPT: string; labelEN: string; valuePT: string; valueEN: string };
type BundleComponentForm = { productId: string; variantId: string; qty: number };

type FormState = {
  productType: 'standard' | 'bundle';
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
  hasColor: boolean;
  hasOption: boolean;
  optionLabelPT: string;
  optionLabelEN: string;
  optionValuesEN: Record<string, string>;
  specifications: SpecificationForm[];
  returnEligible: boolean;
  returnNotePT: string;
  returnNoteEN: string;
  bundleComponents: BundleComponentForm[];
  /** Merch tag ids (string form). hasMany since 2026-07-31 (admin bug
   * report: "I can only select one merchandising tag per item") -- empty
   * array = no badges. */
  tagIds: string[];
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

const EMPTY: FormState = { productType: 'standard', name: '', namePT: '', nameEN: '', slug: '', category: '', description: '', descriptionPT: '', descriptionEN: '', sizeGuide: '', fitNotePT: '', fitNoteEN: '', hasColor: true, hasOption: true, optionLabelPT: 'Tamanho', optionLabelEN: 'Size', optionValuesEN: { S: 'S', M: 'M', L: 'L' }, specifications: [], returnEligible: true, returnNotePT: '', returnNoteEN: '', bundleComponents: [], tagIds: [], colorIds: [], sizes: ['S', 'M', 'L'], stock: {}, priceAOKz: '', pricePTEur: '', shippingWeightGrams: '500', saleAOKz: '', salePTEur: '', saleStartDate: '', saleEndDate: '', active: false, availableAO: true, availablePT: true };

/** Payload date fields round-trip as full ISO datetimes; the admin form uses
 * a plain <input type="date">, which needs just the YYYY-MM-DD portion. */
function toDateInputValue(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

function formFromVariants(variants: ApiVariant[]): Pick<FormState, 'hasColor' | 'hasOption' | 'colorIds' | 'sizes' | 'optionValuesEN' | 'stock'> {
  const colorIds: string[] = [];
  const sizes: string[] = [];
  const stock: Record<string, StockCell> = {};
  const optionValuesEN: Record<string, string> = {};
  for (const variant of variants) {
    const colorId = refId(variant.color);
    if (colorId && !colorIds.includes(colorId)) colorIds.push(colorId);
    const optionValue = variant.size ?? '';
    if (optionValue && !sizes.includes(optionValue)) sizes.push(optionValue);
    if (optionValue) optionValuesEN[optionValue] = variant.optionValueEN?.trim() || optionValue;
    stock[cellKey(colorId, optionValue)] = { ao: variant.stockAO, pt: variant.stockPT, variantId: variant.id ?? undefined };
  }
  sizes.sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b));
  return { hasColor: colorIds.length > 0, hasOption: sizes.length > 0, colorIds, sizes, optionValuesEN, stock };
}

export function ProductEditor() {
  const { lang } = useApp();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'novo';
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  // Snapshot of `form` exactly as loaded, to tell whether anything has
  // actually changed (2026-07-31 admin report) -- see admin/lib/useDirty.ts.
  const [originalForm, setOriginalForm] = useState<FormState | null>(null);
  const [existing, setExisting] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newImageAlt, setNewImageAlt] = useState('');

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiMerchTag[]>([]);
  const [colors, setColors] = useState<ApiColor[]>([]);
  const [sizeGuides, setSizeGuides] = useState<ApiSizeGuide[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    adminListProducts().then(setCatalogProducts).catch(() => undefined);
  }, []);

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
        const loaded: FormState = {
          productType: p.productType === 'bundle' ? 'bundle' : 'standard',
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
          optionLabelPT: p.optionLabelPT ?? '',
          optionLabelEN: p.optionLabelEN ?? '',
          specifications: (p.specifications ?? []).map((entry) => ({ labelPT: entry.labelPT, labelEN: entry.labelEN ?? '', valuePT: entry.valuePT, valueEN: entry.valueEN ?? '' })),
          returnEligible: p.returnEligible !== false,
          returnNotePT: p.returnNotePT ?? '',
          returnNoteEN: p.returnNoteEN ?? '',
          bundleComponents: (p.bundleComponents ?? []).map((component) => ({ productId: refId(component.product), variantId: component.variantId, qty: component.qty })),
          tagIds: (p.tag ?? []).map((ref) => refId(ref)).filter(Boolean),
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
        };
        setForm(loaded);
        setOriginalForm(loaded);
      })
      .catch(() => setError(t('couldntConnectBackend', lang)))
      .finally(() => setLoading(false));
  }, [id, isNew, lang]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Hook called unconditionally every render (Rules of Hooks) -- isNew can
  // flip to false mid-lifecycle without remounting (creating a product
  // navigates to its own new /admin/produtos/:id, same route component,
  // just a changed :id param), so the OR below, not a short-circuited call,
  // is what keeps a brand-new record's Save always enabled: there's no
  // "unchanged" baseline to speak of yet, subject to the validation
  // handleSave already does.
  const formIsDirty = useDirty(form, originalForm);
  const isDirty = isNew || formIsDirty;

  /** Maps a string-form id back to the ORIGINAL id (number under Postgres,
   * string under SQLite) so Payload's relationship validation accepts it. */
  const originalId = (docs: { id: string | number }[], stringId: string): string | number =>
    docs.find((d) => String(d.id) === stringId)?.id ?? stringId;

  const selectedCategory = categories.find((category) => String(category.id) === form.category);
  const selectedCategoryLabel = (lang === 'en' ? selectedCategory?.nameEN : selectedCategory?.namePT)?.trim()
    || selectedCategory?.namePT
    || '';
  const suggestedImageAlt = buildProductImageAlt({
    productName: form.namePT || form.name,
    productType: selectedCategoryLabel,
  });

  const toggleColor = (colorId: string) =>
    setForm((f) => ({
      ...f,
      colorIds: f.colorIds.includes(colorId) ? f.colorIds.filter((c) => c !== colorId) : [...f.colorIds, colorId],
    }));

  const toggleTag = (tagId: string) =>
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId) ? f.tagIds.filter((t) => t !== tagId) : [...f.tagIds, tagId],
    }));

  const toggleSize = (size: string) =>
    setForm((f) => {
      const selected = f.sizes.includes(size);
      const optionValuesEN = { ...f.optionValuesEN };
      if (selected) delete optionValuesEN[size];
      else optionValuesEN[size] = optionValuesEN[size] || size;
      return {
        ...f,
        optionValuesEN,
        sizes: selected
          ? f.sizes.filter((s) => s !== size)
          : [...f.sizes, size].sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b)),
      };
    });

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
    if (form.productType === 'standard' && ((form.hasColor && form.colorIds.length === 0) || (form.hasOption && form.sizes.length === 0))) {
      setError(lang === 'pt' ? 'Escolha pelo menos um valor para cada opção ativa.' : 'Choose at least one value for every active option.');
      return;
    }
    if (form.productType === 'bundle' && form.bundleComponents.length === 0) {
      setError(lang === 'pt' ? 'Adicione pelo menos um produto ao kit.' : 'Add at least one product to the kit.');
      return;
    }
    setSaving(true);
    setError(null);
    const colorAxis = form.hasColor ? form.colorIds : [''];
    const optionAxis = form.hasOption ? form.sizes : [''];
    const variants = form.productType === 'bundle' ? [] : colorAxis.flatMap((colorId) =>
      optionAxis.map((size) => {
        const cell = form.stock[cellKey(colorId, size)] ?? { ao: 0, pt: 0 };
        return {
          id: cell.variantId,
          color: colorId ? originalId(colors, colorId) : null,
          size: size || null,
          optionValueEN: size ? (form.optionValuesEN[size]?.trim() || size) : null,
          stockAO: cell.ao,
          stockPT: cell.pt,
        };
      }),
    );
    const payload: Partial<ApiProduct> = {
      productType: form.productType,
      name: form.namePT || form.name,
      namePT: form.namePT,
      nameEN: form.nameEN,
      // slug intentionally omitted -- server-generated, never client-supplied.
      category: originalId(categories, form.category),
      description: form.descriptionPT || form.description,
      descriptionPT: form.descriptionPT,
      descriptionEN: form.descriptionEN,
      sizeGuide: form.productType === 'standard' && form.hasOption && form.sizeGuide ? originalId(sizeGuides, form.sizeGuide) : null,
      fitNotePT: form.productType === 'standard' ? (form.fitNotePT || null) : null,
      fitNoteEN: form.productType === 'standard' ? (form.fitNoteEN || null) : null,
      optionLabelPT: form.productType === 'standard' && form.hasOption ? form.optionLabelPT.trim() : null,
      optionLabelEN: form.productType === 'standard' && form.hasOption ? form.optionLabelEN.trim() : null,
      specifications: form.specifications.filter((entry) => entry.labelPT.trim() && entry.valuePT.trim()),
      returnEligible: form.returnEligible,
      returnNotePT: form.returnNotePT || null,
      returnNoteEN: form.returnNoteEN || null,
      bundleComponents: form.productType === 'bundle' ? form.bundleComponents.map((component) => ({
        product: originalId(catalogProducts, component.productId),
        variantId: component.variantId,
        qty: Math.max(1, Number(component.qty) || 1),
      })) : [],
      // Empty array (not undefined) so removing every badge actually clears
      // them -- hasMany since 2026-07-31.
      tag: form.tagIds.map((tagId) => originalId(tags, tagId)),
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
        // Stays in the editor rather than bouncing to the list: image upload
        // needs a saved product to attach to, so sending the admin away here
        // would mean re-opening the item they just made in order to add
        // photographs.
        navigateWithToast(navigate, `/admin/produtos/${created.id}`, t('productCreated', lang, { name: payload.name ?? '' }));
      } else if (existing) {
        await adminUpdateProduct(existing.id, payload);
        navigateWithToast(navigate, '/admin/produtos', t('productSaved', lang, { name: payload.name ?? '' }));
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
      await validateImageUpload(file, 'catalogue', lang);
      await adminDeleteProduct(existing.id);
      navigateWithToast(navigate, '/admin/produtos', t('productDeleted', lang, { name: form.name }));
    } catch {
      setError(t('couldntDeleteProduct', lang));
      setSaving(false);
    }
  };

  // Shared row -> save-payload conversion, used by every image mutation
  // below. Always carries the row's existing `color` tag forward unless a
  // caller explicitly overrides it -- earlier versions of delete/reorder
  // mapped down to `{ image }` only, which would have silently wiped every
  // photo's colour tag on the very next delete or reorder after this
  // feature shipped (2026-08-07, per-colour galleries).
  const serializeImageRow = (row: NonNullable<ApiProduct['images']>[number]) => ({
    image: typeof row.image === 'object' ? row.image.id! : row.image,
    color: row.color ? (typeof row.color === 'object' ? row.color.id! : row.color) : null,
  });

  const handleImageUpload = async (file?: File) => {
    if (!file || !existing) return;
    setSaving(true);
    setError(null);
    try {
      // The custom admin now explicitly prompts for image alt text. When the
      // admin accepts the suggestion, it still produces meaningful stored
      // content instead of the old product-name-only value; Payload's Media
      // validation is the authoritative final guard against whitespace.
      const media = await adminUploadProductImage(file, newImageAlt.trim() || suggestedImageAlt);
      const images = [
        ...(existing.images ?? []).map(serializeImageRow),
        { image: media.id, color: null },
      ];
      const updated = await adminUpdateProduct(existing.id, { images });
      setExisting(updated);
      setNewImageAlt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('couldntUploadImage', lang));
    } finally {
      setSaving(false);
    }
  };

  // Image thumbnail grid (2026-08-07 bug fix): the editor used to render
  // only images[0] in one static box, with a single "Add photos" button that
  // just appended -- so a 2nd+ photo had nowhere to be seen, and nothing
  // could ever be removed. Delete, reorder and colour-tagging below follow
  // the exact same "persist immediately via adminUpdateProduct, don't wait
  // for the Save button" pattern handleImageUpload above already
  // established -- images were never part of the gated FormState/handleSave
  // flow.
  const handleImageDelete = async (index: number) => {
    if (!existing) return;
    if (!window.confirm(t('deleteImageConfirm', lang))) return;
    setSaving(true);
    setError(null);
    try {
      const images = (existing.images ?? [])
        .filter((_, i) => i !== index)
        .map(serializeImageRow);
      const updated = await adminUpdateProduct(existing.id, { images });
      setExisting(updated);
    } catch {
      setError(t('couldntDeleteImage', lang));
    } finally {
      setSaving(false);
    }
  };

  const handleImageReorder = async (index: number, direction: -1 | 1) => {
    if (!existing) return;
    const current = existing.images ?? [];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    setSaving(true);
    setError(null);
    try {
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      const images = reordered.map(serializeImageRow);
      const updated = await adminUpdateProduct(existing.id, { images });
      setExisting(updated);
    } catch {
      setError(t('couldntReorderImages', lang));
    } finally {
      setSaving(false);
    }
  };

  // Per-colour photo tagging (2026-08-07): empty string clears the tag back
  // to "general" (shown for every colour) -- matches the same
  // empty-string-means-null convention the size/colour matrix elsewhere in
  // this form already uses.
  const handleImageColorChange = async (index: number, colorId: string) => {
    if (!existing) return;
    setSaving(true);
    setError(null);
    try {
      const images = (existing.images ?? []).map((row, i) => {
        const base = serializeImageRow(row);
        return i === index ? { ...base, color: colorId ? originalId(colors, colorId) : null } : base;
      });
      const updated = await adminUpdateProduct(existing.id, { images });
      setExisting(updated);
    } catch {
      setError(t('couldntSaveBackend', lang));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>;

  const selectStyle: React.CSSProperties = { width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink };
  const matrixColors = form.hasColor ? form.colorIds : [''];
  const matrixOptions = form.hasOption ? form.sizes : [''];

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={isNew ? t('crumbAddProduct', lang) : t('crumbEditProduct', lang, { name: form.name })}
        title={isNew ? t('createCatalogueItem', lang) : form.name}
        subtitle={t('enterEverythingSubtitle', lang)}
        cta={isNew ? t('publishProduct', lang) : t('saveChanges', lang)}
        onCta={handleSave}
        ctaBusy={saving}
        ctaDisabled={!isDirty}
        backTo="/admin/produtos"
        backLabel={t('backToProducts', lang)}
      />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'flex-start' }} className="ump-admin-orders-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16, minWidth: 0 }}>
          <div
            style={{
              height: 220,
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
              t('noPhotosYet', lang)
            )}
          </div>

          <label style={{ display: 'block', marginTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('imageAltLabel', lang)}</div>
            <input
              value={newImageAlt}
              disabled={!existing || saving}
              placeholder={suggestedImageAlt}
              onChange={(event) => setNewImageAlt(event.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 10, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
            />
            <div style={{ marginTop: 5, fontSize: 8, lineHeight: 1.45, color: C.inkSoft }}>{t('imageAltHelp', lang, { suggestion: suggestedImageAlt })}</div>
          </label>

          {/* Thumbnail grid (2026-08-07 bug fix): every uploaded photo shown
              here, not just the first -- each with its own delete button and
              left/right reorder arrows. The first tile is flagged "Cover"
              since it's what the big preview above and every product
              card/hero elsewhere on the storefront actually use. When the
              product has colours configured, each thumbnail also gets a
              small colour picker underneath (2026-08-07 per-colour
              galleries) -- "General" (the default) means the photo shows
              for every colour; tagging it narrows it to just that one on
              the product page. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {(existing?.images ?? []).map((row, index) => {
              const resolved = resolveProductImage(row.image);
              const count = existing?.images?.length ?? 0;
              const rowColorId = row.color ? String(refId(row.color)) : '';
              return (
                <div key={row.id ?? index} style={{ display: 'flex', flexDirection: 'column', borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.ruleLight}` }}>
                  <div style={{ position: 'relative', aspectRatio: '1 / 1', background: C.subtleBg }}>
                    <img src={resolved.url} alt={resolved.alt ?? form.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {index === 0 && (
                      <div style={{ position: 'absolute', top: 4, left: 4, padding: '2px 6px', borderRadius: 4, background: 'rgba(20,20,20,0.7)', color: '#fff', fontSize: 8, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                        {t('coverImageBadge', lang)}
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={t('deleteImageAriaLabel', lang)}
                      disabled={saving}
                      onClick={() => void handleImageDelete(index)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 999, border: 'none', background: 'rgba(20,20,20,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving ? 'default' : 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <button
                        type="button"
                        aria-label={t('moveImageEarlierAriaLabel', lang)}
                        disabled={saving || index === 0}
                        onClick={() => void handleImageReorder(index, -1)}
                        style={{ width: 20, height: 20, borderRadius: 999, border: 'none', background: 'rgba(20,20,20,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving || index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.35 : 1 }}
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={t('moveImageLaterAriaLabel', lang)}
                        disabled={saving || index === count - 1}
                        onClick={() => void handleImageReorder(index, 1)}
                        style={{ width: 20, height: 20, borderRadius: 999, border: 'none', background: 'rgba(20,20,20,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving || index === count - 1 ? 'default' : 'pointer', opacity: index === count - 1 ? 0.35 : 1 }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                  {form.hasColor && colors.length > 0 && (
                    <select
                      value={rowColorId}
                      disabled={saving}
                      onChange={(e) => void handleImageColorChange(index, e.target.value)}
                      style={{ width: '100%', border: 'none', borderTop: `1px solid ${C.ruleLight}`, background: C.paper, color: C.ink, fontSize: 8, fontWeight: 700, padding: '3px 2px' }}
                    >
                      <option value="">{t('generalPhotoOption', lang)}</option>
                      {colors.map((co) => (
                        <option key={String(co.id)} value={String(co.id)}>{colorLabel(co)}</option>
                      ))}
                    </select>
                  )}
                  <div title={resolved.alt} style={{ padding: '4px 5px', borderTop: `1px solid ${C.ruleLight}`, fontSize: 7, lineHeight: 1.35, color: C.inkSoft, overflowWrap: 'anywhere' }}>
                    {resolved.alt || suggestedImageAlt}
                  </div>
                </div>
              );
            })}
            <label
              style={{
                aspectRatio: '1 / 1', borderRadius: 6, border: `1px dashed ${C.rule}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: existing ? 'pointer' : 'not-allowed', color: C.inkSoft, fontSize: 8, fontWeight: 800,
                textAlign: 'center', opacity: existing ? 1 : 0.5, padding: 4,
              }}
            >
              <Plus size={16} />
              {t('addPhotoTile', lang)}
              <input type="file" accept="image/*" hidden disabled={!existing || saving} onChange={(e) => void handleImageUpload(e.target.files?.[0])} />
            </label>
          </div>
          <div style={{ marginTop: 7, fontSize: 9, color: C.inkSoft }}>{imageUploadGuidance('catalogue', lang)}</div>
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
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{lang === 'pt' ? 'Tipo de produto' : 'Product type'}</div>
              <select value={form.productType} onChange={(e) => set('productType', e.target.value as FormState['productType'])} style={selectStyle}>
                <option value="standard">{lang === 'pt' ? 'Produto normal' : 'Standard product'}</option>
                <option value="bundle">{lang === 'pt' ? 'Kit de produtos' : 'Product kit'}</option>
              </select>
            </label>
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
            <div style={{ display: 'block' }}>
              {/* Multi-select since 2026-07-31 (admin bug report: "I can only
                  select one merchandising tag per item") -- was a single
                  <select>, now toggle chips matching the colours/sizes
                  pattern below so a product can carry more than one badge. */}
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('merchTagLabel', lang)}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.length === 0 && <span style={{ fontSize: 11, color: C.inkSoft }}>{t('noneOption', lang)}</span>}
                {tags.map((tg) => {
                  const tid = String(tg.id);
                  const selected = form.tagIds.includes(tid);
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => toggleTag(tid)}
                      aria-pressed={selected}
                      style={{
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
                      {tg.labelPT}{tg.labelEN && tg.labelEN !== tg.labelPT ? ` / ${tg.labelEN}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
            {form.productType === 'standard' && form.hasOption && <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('sizeGuideLabel', lang)}</div>
              <select value={form.sizeGuide} onChange={(e) => set('sizeGuide', e.target.value)} style={selectStyle}>
                <option value="">{t('noneOption', lang)}</option>
                {sizeGuides.map((g) => (
                  <option key={String(g.id)} value={String(g.id)}>{g.name}</option>
                ))}
              </select>
              <div style={{ marginTop: 6, color: C.inkSoft, fontSize: 10, lineHeight: 1.5 }}>{t('sizeGuideAssignmentHint', lang)}</div>
            </label>}
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

          {form.productType === 'standard' ? (
            <div style={{ padding: 14, border: `1px solid ${C.ruleLight}`, borderRadius: 8, display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <CheckField label={lang === 'pt' ? 'Este produto tem cores' : 'This product has colours'} checked={form.hasColor} onChange={(value) => set('hasColor', value)} />
                <CheckField label={lang === 'pt' ? 'Este produto tem outra opção' : 'This product has another option'} checked={form.hasOption} onChange={(value) => set('hasOption', value)} />
              </div>

              {form.hasColor && <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('coloursLabel', lang)}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {colors.map((c) => {
                    const cid = String(c.id); const selected = form.colorIds.includes(cid); const swatch = resolveRef(c.swatch);
                    return <button key={cid} type="button" onClick={() => toggleColor(cid)} aria-pressed={selected} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, borderRadius: 20, border: `1.5px solid ${selected ? C.gold : C.rule}`, background: selected ? C.tagBg : C.paper, color: selected ? C.goldDeep : C.ink }}>
                      {hasSwatch({ hex: c.hex, hex2: c.hex2, swatchUrl: swatch?.url }) && <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', border: `1px solid ${C.rule}`, background: swatchBackground({ hex: c.hex, hex2: c.hex2, swatchUrl: swatch?.url }) }} />}
                      {colorLabel(c)}
                    </button>;
                  })}
                </div>
              </div>}

              {form.hasOption && <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="ump-admin-fields-grid">
                  <FieldInput label={lang === 'pt' ? 'Nome da opção — Português' : 'Option name — Portuguese'} value={form.optionLabelPT} onChange={(value) => set('optionLabelPT', value)} />
                  <FieldInput label={lang === 'pt' ? 'Nome da opção — Inglês' : 'Option name — English'} value={form.optionLabelEN} onChange={(value) => set('optionLabelEN', value)} />
                </div>
                <FieldInput
                  label={lang === 'pt' ? 'Valores da opção (separados por vírgulas)' : 'Option values (comma separated)'}
                  value={form.sizes.join(', ')}
                  onChange={(value) => {
                    const values = [...new Set(value.split(',').map((entry) => entry.trim()).filter(Boolean))];
                    setForm((current) => ({
                      ...current,
                      sizes: values,
                      optionValuesEN: Object.fromEntries(values.map((entry) => [entry, current.optionValuesEN[entry] || entry])),
                    }));
                  }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALL_SIZES.map((size) => <button key={size} type="button" onClick={() => toggleSize(size)} style={{ minWidth: 40, padding: '6px 10px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: `1.5px solid ${form.sizes.includes(size) ? C.gold : C.rule}`, background: form.sizes.includes(size) ? C.tagBg : C.paper, color: C.ink }}>{size}</button>)}
                </div>
                {form.sizes.some((value) => (form.optionValuesEN[value] || value) !== value || !ALL_SIZES.includes(value)) && (
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep }}>{lang === 'pt' ? 'Traduções dos valores — Inglês' : 'Option value translations — English'}</div>
                    {form.sizes.map((value) => (
                      <label key={value} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 0.6fr) 1.4fr', gap: 8, alignItems: 'center', fontSize: 11, color: C.ink }}>
                        <span>{value}</span>
                        <input value={form.optionValuesEN[value] || ''} onChange={(event) => set('optionValuesEN', { ...form.optionValuesEN, [value]: event.target.value })} placeholder={value} style={selectStyle} />
                      </label>
                    ))}
                  </div>
                )}
              </div>}

              {matrixColors.length > 0 && matrixOptions.length > 0 && <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{lang === 'pt' ? 'Stock por variante' : 'Stock by variant'} <span style={{ color: C.inkSoft }}>AO / PT</span></div>
                <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 11 }}><thead><tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px 6px 0', color: C.goldDeep }}>{form.hasColor ? t('colourTableHeader', lang) : (lang === 'pt' ? 'Produto' : 'Product')}</th>
                  {matrixOptions.map((option) => <th key={option || 'single'} style={{ padding: '6px 8px', color: C.ink }}>{option || (lang === 'pt' ? 'Único' : 'Single')}</th>)}
                </tr></thead><tbody>
                  {matrixColors.map((colorId) => {
                    const color = colors.find((entry) => String(entry.id) === colorId);
                    return <tr key={colorId || 'single'} style={{ borderTop: `1px solid ${C.ruleLight}` }}><td style={{ paddingRight: 10, fontWeight: 800, color: C.ink }}>{color ? colorLabel(color) : (lang === 'pt' ? 'Sem cor' : 'No colour')}</td>
                      {matrixOptions.map((option) => { const cell = form.stock[cellKey(colorId, option)] ?? { ao: 0, pt: 0 }; return <td key={option || 'single'} style={{ padding: '6px 8px' }}><div style={{ display: 'flex', gap: 4 }}>
                        <input aria-label={`AO ${colorId} ${option}`} type="number" min="0" value={cell.ao} onChange={(event) => setStock(colorId, option, 'ao', Number(event.target.value))} style={{ width: 58, padding: 6, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }} />
                        <input aria-label={`PT ${colorId} ${option}`} type="number" min="0" value={cell.pt} onChange={(event) => setStock(colorId, option, 'pt', Number(event.target.value))} style={{ width: 58, padding: 6, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }} />
                      </div></td>; })}
                    </tr>;
                  })}
                </tbody></table></div>
              </div>}
            </div>
          ) : (
            <div style={{ padding: 14, border: `1px solid ${C.ruleLight}`, borderRadius: 8, display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep }}>{lang === 'pt' ? 'Conteúdo fixo do kit' : 'Fixed kit contents'}</div>
              {form.bundleComponents.map((component, index) => {
                const componentProduct = catalogProducts.find((product) => String(product.id) === component.productId);
                return <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 90px auto', gap: 8 }} className="ump-admin-fields-grid">
                  <select value={component.productId} onChange={(event) => set('bundleComponents', form.bundleComponents.map((row, rowIndex) => rowIndex === index ? { ...row, productId: event.target.value, variantId: '' } : row))} style={selectStyle}>
                    <option value="">{lang === 'pt' ? 'Escolher produto' : 'Choose product'}</option>
                    {catalogProducts.filter((product) => product.productType !== 'bundle' && String(product.id) !== String(existing?.id ?? '')).map((product) => <option key={String(product.id)} value={String(product.id)}>{product.namePT || product.name}</option>)}
                  </select>
                  <select value={component.variantId} onChange={(event) => set('bundleComponents', form.bundleComponents.map((row, rowIndex) => rowIndex === index ? { ...row, variantId: event.target.value } : row))} style={selectStyle}>
                    <option value="">{lang === 'pt' ? 'Escolher variante' : 'Choose variant'}</option>
                    {(componentProduct?.variants ?? []).map((variant) => { const colour = colors.find((entry) => String(entry.id) === refId(variant.color)); const option = (lang === 'en' ? variant.optionValueEN : variant.size) || variant.size || (lang === 'pt' ? 'Único' : 'Single'); const label = [colour ? colorLabel(colour) : '', option].filter(Boolean).join(' · '); return <option key={String(variant.id)} value={String(variant.id)}>{label}</option>; })}
                  </select>
                  <input aria-label={lang === 'pt' ? 'Quantidade' : 'Quantity'} type="number" min="1" value={component.qty} onChange={(event) => set('bundleComponents', form.bundleComponents.map((row, rowIndex) => rowIndex === index ? { ...row, qty: Number(event.target.value) } : row))} style={selectStyle} />
                  <button type="button" onClick={() => set('bundleComponents', form.bundleComponents.filter((_, rowIndex) => rowIndex !== index))} style={{ color: C.dangerStrong, fontWeight: 800 }}>×</button>
                </div>;
              })}
              <button type="button" onClick={() => set('bundleComponents', [...form.bundleComponents, { productId: '', variantId: '', qty: 1 }])} style={{ justifySelf: 'start', padding: '8px 12px', border: `1px solid ${C.rule}`, borderRadius: 6, color: C.ink, fontWeight: 800 }}>{lang === 'pt' ? '+ Adicionar produto' : '+ Add product'}</button>
              <div style={{ fontSize: 10, color: C.inkSoft }}>{lang === 'pt' ? 'A disponibilidade e o stock do kit são calculados a partir destas variantes.' : 'Kit availability and stock are calculated from these variants.'}</div>
            </div>
          )}

          <div style={{ padding: 14, border: `1px solid ${C.ruleLight}`, borderRadius: 8, display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep }}>{lang === 'pt' ? 'Detalhes do produto' : 'Product details'}</div>
            {form.specifications.map((entry, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8 }} className="ump-admin-fields-grid">
              {(['labelPT', 'labelEN', 'valuePT', 'valueEN'] as const).map((key) => <input key={key} value={entry[key]} placeholder={key} onChange={(event) => set('specifications', form.specifications.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: event.target.value } : row))} style={selectStyle} />)}
              <button type="button" onClick={() => set('specifications', form.specifications.filter((_, rowIndex) => rowIndex !== index))} style={{ color: C.dangerStrong, fontWeight: 800 }}>×</button>
            </div>)}
            <button type="button" onClick={() => set('specifications', [...form.specifications, { labelPT: '', labelEN: '', valuePT: '', valueEN: '' }])} style={{ justifySelf: 'start', padding: '8px 12px', border: `1px solid ${C.rule}`, borderRadius: 6, color: C.ink, fontWeight: 800 }}>{lang === 'pt' ? '+ Adicionar detalhe' : '+ Add detail'}</button>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <CheckField label={t('publishedLabel', lang)} checked={form.active} onChange={(v) => set('active', v)} />
            <CheckField label={t('availableAngola', lang)} checked={form.availableAO} onChange={(v) => set('availableAO', v)} />
            <CheckField label={t('availablePortugal', lang)} checked={form.availablePT} onChange={(v) => set('availablePT', v)} />
            <CheckField label={lang === 'pt' ? 'Elegível para devolução normal' : 'Eligible for normal returns'} checked={form.returnEligible} onChange={(v) => set('returnEligible', v)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="ump-admin-fields-grid">
            <FieldInput label={lang === 'pt' ? 'Nota de devolução — Português' : 'Return note — Portuguese'} value={form.returnNotePT} onChange={(value) => set('returnNotePT', value)} />
            <FieldInput label={lang === 'pt' ? 'Nota de devolução — Inglês' : 'Return note — English'} value={form.returnNoteEN} onChange={(value) => set('returnNoteEN', value)} />
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

          {form.productType === 'standard' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
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
          </div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              style={{
                padding: 12,
                background: saving || !isDirty ? C.disabledBg : C.black,
                color: saving || !isDirty ? C.disabledFg : C.onDarkGold,
                fontSize: 11,
                fontWeight: 800,
                borderRadius: 6,
                alignSelf: 'flex-start',
                minWidth: 160,
                cursor: saving || !isDirty ? 'default' : 'pointer',
              }}
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
