import { useEffect, useMemo, useState } from 'react';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminCreateCategory,
  adminCreateColor,
  adminCreateMerchTag,
  adminCreateSizeGuide,
  adminDeleteCategory,
  adminDeleteColor,
  adminDeleteMerchTag,
  adminDeleteSizeGuide,
  adminListCategories,
  adminListColors,
  adminListMerchTags,
  adminListProducts,
  adminListSizeGuides,
  adminUpdateCategory,
  adminUpdateColor,
  adminUpdateMerchTag,
  adminUpdateSizeGuide,
  adminUploadMedia,
  colorLabel,
  refId,
  resolveRef,
  taxonomyErrorMessage,
  type ApiCategory,
  type ApiColor,
  type ApiMerchTag,
  type ApiProduct,
  type ApiSizeGuide,
  type ApiSizeGuideRow,
} from '../../lib/api';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';
import { suggestColorName } from '../../lib/colorNaming';
import { t, type Lang } from '../i18n';
import { imageOptimizationSummary, imageUploadGuidance, prepareImageUpload } from '../../lib/imageUpload';
import { ImageCropModal } from '../components/ImageCropModal';

// Product settings (2026-07-25 admin request; moved into Settings as its
// own tab 2026-07-25): manages the catalogue taxonomies -- categories,
// merchandising tags, colours, and size guides. The product editor only
// PICKS from these lists. Rendered as a Settings tab body (see
// Settings.tsx's `tab === 'products'` case) -- no PageHeader of its own,
// since Settings already renders one for the active tab.
//
// Deletion is guarded twice: buttons disable while anything references the
// entry (usage counts computed client-side from the product list), and the
// CMS's beforeDelete hooks refuse regardless (see lib/taxonomyGuards.ts in
// the CMS repo), so the native Payload admin can't orphan products either.

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export function ProductTaxonomySettings() {
  const { lang } = useApp();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiMerchTag[]>([]);
  const [colors, setColors] = useState<ApiColor[]>([]);
  const [guides, setGuides] = useState<ApiSizeGuide[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminListCategories(), adminListMerchTags(), adminListColors(), adminListSizeGuides(), adminListProducts()])
      .then(([cats, tagDocs, colorDocs, guideDocs, productDocs]) => {
        setCategories(cats);
        setTags(tagDocs);
        setColors(colorDocs);
        setGuides(guideDocs);
        setProducts(productDocs);
      })
      .catch(() => setError(t('couldntConnectBackend', lang)))
      .finally(() => setLoading(false));
  }, [lang]);

  // Usage counts, client-side from the (small) product list -- avoids one
  // count request per entry.
  const usage = useMemo(() => {
    const byCategory = new Map<string, number>();
    const byTag = new Map<string, number>();
    const byColor = new Map<string, number>();
    const byGuide = new Map<string, number>();
    const bump = (map: Map<string, number>, key: string) => {
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    };
    for (const p of products) {
      bump(byCategory, refId(p.category));
      // hasMany since 2026-07-31 -- count every tag the product carries,
      // not just a single one.
      for (const tagKey of new Set((p.tag ?? []).map((ref) => refId(ref)))) bump(byTag, tagKey);
      bump(byGuide, refId(p.sizeGuide));
      for (const colorKey of new Set((p.variants ?? []).map((v) => refId(v.color)))) bump(byColor, colorKey);
    }
    return { byCategory, byTag, byColor, byGuide };
  }, [products]);

  if (loading) return <div style={{ padding: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>;

  return (
    <div style={{ padding: '20px 28px 32px' }}>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignItems: 'flex-start' }} className="ump-admin-orders-grid">
        <TaxonomyPanel
          title={t('categoriesTitle', lang)}
          hint={t('categoriesHint', lang)}
          entries={categories.map((c) => ({
            id: String(c.id),
            primary: c.namePT,
            secondary: c.nameEN ?? '',
            meta: c.slug ?? '',
            imageUrl: absoluteMediaUrl(resolveRef(c.image)?.url),
          }))}
          usage={usage.byCategory}
          labels={{ primary: t('namePortugueseLabel', lang), secondary: t('nameEnglishOptionalLabel', lang) }}
          onCreate={async (primary, secondary) => {
            const created = await adminCreateCategory({ namePT: primary, nameEN: secondary || undefined });
            setCategories((prev) => [...prev, created]);
          }}
          onSave={async (id, primary, secondary) => {
            const updated = await adminUpdateCategory(id, { namePT: primary, nameEN: secondary || undefined });
            setCategories((prev) => prev.map((c) => (String(c.id) === id ? updated : c)));
          }}
          onDelete={async (id) => {
            await adminDeleteCategory(id);
            setCategories((prev) => prev.filter((c) => String(c.id) !== id));
          }}
          // Home page tile image (2026-07-25 admin request): upload happens
          // as a separate PATCH from the name/slug save above, same pattern
          // as the home hero image in Settings.tsx.
          onUploadImage={async (id, file) => {
            const prepared = await prepareImageUpload(file, 'catalogue', lang);
            const category = categories.find((c) => String(c.id) === id);
            const media = await adminUploadMedia(prepared.file, `${category?.namePT ?? 'Category'} tile image`);
            const updated = await adminUpdateCategory(id, { image: media.id });
            setCategories((prev) => prev.map((c) => (String(c.id) === id ? updated : c)));
            return imageOptimizationSummary(prepared, lang) ?? undefined;
          }}
          onRemoveImage={async (id) => {
            const updated = await adminUpdateCategory(id, { image: null });
            setCategories((prev) => prev.map((c) => (String(c.id) === id ? updated : c)));
          }}
          setError={setError}
          lang={lang}
        />

        <TaxonomyPanel
          title={t('merchTagsTitle', lang)}
          hint={t('merchTagsHint', lang)}
          entries={tags.map((tg) => ({ id: String(tg.id), primary: tg.labelPT, secondary: tg.labelEN ?? '', meta: tg.slug ?? '' }))}
          usage={usage.byTag}
          labels={{ primary: t('labelPortugueseLabel', lang), secondary: t('labelEnglishOptionalLabel', lang) }}
          onCreate={async (primary, secondary) => {
            const created = await adminCreateMerchTag({ labelPT: primary, labelEN: secondary || undefined });
            setTags((prev) => [...prev, created]);
          }}
          onSave={async (id, primary, secondary) => {
            const updated = await adminUpdateMerchTag(id, { labelPT: primary, labelEN: secondary || undefined });
            setTags((prev) => prev.map((tg) => (String(tg.id) === id ? updated : tg)));
          }}
          onDelete={async (id) => {
            await adminDeleteMerchTag(id);
            setTags((prev) => prev.filter((tg) => String(tg.id) !== id));
          }}
          setError={setError}
          lang={lang}
        />

        <ColorsPanel colors={colors} setColors={setColors} usage={usage.byColor} setError={setError} lang={lang} />

        <SizeGuidesPanel guides={guides} setGuides={setGuides} usage={usage.byGuide} setError={setError} lang={lang} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 10, color: C.inkSoft, marginBottom: 12 }}>{hint}</div>
      {children}
    </div>
  );
}

function UsageBadge({ count, lang }: { count: number; lang: Lang }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color: count > 0 ? C.goldDeep : C.inkSoft, background: count > 0 ? C.tagBg : C.subtleBg, borderRadius: 10, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {count === 1 ? t('productCountBadge', lang, { n: count }) : t('productCountBadgePlural', lang, { n: count })}
    </span>
  );
}

function SmallButton({ label, onClick, disabled, danger, title }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '5px 10px',
        fontSize: 10,
        fontWeight: 800,
        borderRadius: 6,
        border: `1px solid ${danger ? '#E1B3AA' : C.rule}`,
        background: 'transparent',
        color: disabled ? C.inkSoft : danger ? '#B95545' : C.ink,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = { padding: '8px 10px', fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, minWidth: 0 };

// ---------------------------------------------------------------------------
// Categories / tags: same two-text-field shape, one shared panel
// ---------------------------------------------------------------------------

type TaxonomyEntry = { id: string; primary: string; secondary: string; meta?: string; imageUrl?: string };
type PendingTaxonomyImage = { id: string; file: File; preview: string };

function TaxonomyPanel({
  title,
  hint,
  entries,
  usage,
  labels,
  onCreate,
  onSave,
  onDelete,
  onUploadImage,
  onRemoveImage,
  setError,
  lang,
}: {
  title: string;
  hint: string;
  entries: TaxonomyEntry[];
  usage: Map<string, number>;
  labels: { primary: string; secondary: string };
  onCreate: (primary: string, secondary: string) => Promise<void>;
  onSave: (id: string, primary: string, secondary: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Optional image upload/remove (2026-07-25 admin request, Categories
   * only) -- happens as its own save, separate from onSave's name/slug PATCH,
   * since the entry must already exist to attach media to it. */
  onUploadImage?: (id: string, file: File) => Promise<string | undefined>;
  onRemoveImage?: (id: string) => Promise<void>;
  setError: (message: string | null) => void;
  lang: Lang;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ primary: string; secondary: string }>({ primary: '', secondary: '' });
  const [newDraft, setNewDraft] = useState<{ primary: string; secondary: string }>({ primary: '', secondary: '' });
  const [busy, setBusy] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ id: string; file: File } | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingTaxonomyImage | null>(null);

  useEffect(() => () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.preview);
  }, [pendingImage]);

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(taxonomyErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const runImage = async (id: string, fn: () => Promise<string | undefined | void>, fallback: string) => {
    setUploadingImageId(id);
    setError(null);
    setUploadNotice(null);
    try {
      setUploadNotice((await fn()) ?? null);
    } catch (err) {
      setError(taxonomyErrorMessage(err, fallback));
    } finally {
      setUploadingImageId(null);
    }
  };

  return (
    <Panel title={title} hint={hint}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map((entry) => {
          const count = usage.get(entry.id) ?? 0;
          const isEditing = editing === entry.id;
          const isUploadingImage = uploadingImageId === entry.id;
          const pendingForEntry = pendingImage?.id === entry.id ? pendingImage : null;
          return (
            <div key={entry.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '7px 10px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>
              {isEditing ? (
                <>
                  <input aria-label={labels.primary} value={draft.primary} onChange={(e) => setDraft((d) => ({ ...d, primary: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <input aria-label={labels.secondary} value={draft.secondary} onChange={(e) => setDraft((d) => ({ ...d, secondary: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <SmallButton label={t('saveAction', lang)} disabled={busy || !draft.primary.trim()} onClick={() => void run(async () => { await onSave(entry.id, draft.primary.trim(), draft.secondary.trim()); setEditing(null); }, t('couldntSaveChange', lang))} />
                  <SmallButton label={t('cancelAction', lang)} onClick={() => setEditing(null)} />
                </>
              ) : (
                <>
                  {onUploadImage && (
                    pendingForEntry ? (
                      <img src={pendingForEntry.preview} alt="" style={{ width: 42, aspectRatio: '3 / 4', borderRadius: 4, objectFit: 'cover', border: `2px dashed ${C.goldDeep}`, flexShrink: 0 }} />
                    ) : entry.imageUrl ? (
                      <img src={entry.imageUrl} alt="" style={{ width: 42, aspectRatio: '3 / 4', borderRadius: 4, objectFit: 'cover', border: `1px solid ${C.rule}`, flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 42, aspectRatio: '3 / 4', borderRadius: 4, border: `1px dashed ${C.rule}`, flexShrink: 0 }} title={t('noTileImageYet', lang)} />
                    )
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{entry.primary}</span>
                    {entry.secondary && entry.secondary !== entry.primary && <span style={{ fontSize: 11, color: C.inkSoft }}> / {entry.secondary}</span>}
                    {entry.meta && <span style={{ fontSize: 9, color: C.inkSoft, marginLeft: 6 }}>({entry.meta})</span>}
                  </div>
                  <UsageBadge count={count} lang={lang} />
                  {onUploadImage && (
                    <>
                      {pendingForEntry ? (
                        <>
                          <SmallButton
                            label={isUploadingImage ? '…' : (lang === 'pt' ? 'Guardar imagem' : 'Save image')}
                            disabled={isUploadingImage}
                            onClick={() => void runImage(entry.id, async () => {
                              const notice = await onUploadImage(entry.id, pendingForEntry.file);
                              setPendingImage(null);
                              return notice;
                            }, t('couldntUploadImageGeneric', lang))}
                          />
                          <SmallButton label={t('cancelAction', lang)} disabled={isUploadingImage} onClick={() => setPendingImage(null)} />
                        </>
                      ) : (
                        <label style={{ fontSize: 9, fontWeight: 800, color: isUploadingImage ? C.inkSoft : C.goldDeep, cursor: isUploadingImage ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                          {isUploadingImage ? '…' : entry.imageUrl ? t('changeImage', lang) : t('addImage', lang)}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingImage}
                            style={{ display: 'none' }}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = '';
                              if (file) setCropTarget({ id: entry.id, file });
                            }}
                          />
                        </label>
                      )}
                      {!pendingForEntry && entry.imageUrl && onRemoveImage && (
                        <SmallButton
                          label={t('removeImage', lang)}
                          disabled={isUploadingImage}
                          onClick={() => void runImage(entry.id, () => onRemoveImage(entry.id), t('couldntRemoveImage', lang))}
                        />
                      )}
                    </>
                  )}
                  <SmallButton label={t('editAction', lang)} disabled={busy} onClick={() => { setEditing(entry.id); setDraft({ primary: entry.primary, secondary: entry.secondary }); }} />
                  <SmallButton
                    label={t('deleteAction', lang)}
                    danger
                    disabled={busy || count > 0}
                    title={count > 0 ? t('usedByProductsTitle', lang, { n: count, s: count === 1 ? '' : 's' }) : undefined}
                    onClick={() => { if (window.confirm(t('deleteEntryConfirm', lang, { name: entry.primary }))) void run(() => onDelete(entry.id), t('couldntDeleteInUseGeneric', lang)); }}
                  />
                </>
              )}
            </div>
          );
        })}
        {onUploadImage && <div style={{ fontSize: 9, color: C.inkSoft }}>{imageUploadGuidance('catalogue', lang)}</div>}
        {uploadNotice && <div style={{ fontSize: 10, color: '#3F754D' }}>{uploadNotice}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input placeholder={labels.primary} value={newDraft.primary} onChange={(e) => setNewDraft((d) => ({ ...d, primary: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
        <input placeholder={labels.secondary} value={newDraft.secondary} onChange={(e) => setNewDraft((d) => ({ ...d, secondary: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
        <SmallButton label={t('addAction', lang)} disabled={busy || !newDraft.primary.trim()} onClick={() => void run(async () => { await onCreate(newDraft.primary.trim(), newDraft.secondary.trim()); setNewDraft({ primary: '', secondary: '' }); }, t('couldntCreateEntry', lang))} />
      </div>
      {onUploadImage && <div style={{ fontSize: 9, color: C.inkSoft, marginTop: 8 }}>{t('newEntriesImageNote', lang)}</div>}
      {cropTarget && (
        <ImageCropModal
          key={`${cropTarget.id}-${cropTarget.file.name}-${cropTarget.file.lastModified}`}
          file={cropTarget.file}
          aspect={3 / 4}
          outputWidth={1200}
          outputSuffix="category"
          lang={lang}
          title={lang === 'pt' ? 'Ajustar imagem da categoria' : 'Adjust category image'}
          description={lang === 'pt' ? 'Escolha o enquadramento vertical 3:4 que aparecerá no mosaico da página inicial.' : 'Choose the 3:4 portrait framing used by the home-page category tile.'}
          onCancel={() => setCropTarget(null)}
          onApply={(file) => {
            setPendingImage({ id: cropTarget.id, file, preview: URL.createObjectURL(file) });
            setCropTarget(null);
          }}
        />
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Colours: name + hex (or pattern) with swatch preview
// ---------------------------------------------------------------------------

function ColorDot({ hex, hex2, swatchUrl, lang }: { hex?: string | null; hex2?: string | null; swatchUrl?: string; lang: Lang }) {
  if (!hasSwatch({ hex, hex2, swatchUrl })) {
    return <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px dashed ${C.rule}`, flexShrink: 0 }} title={t('noSwatchYet', lang)} />;
  }
  return <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${C.rule}`, flexShrink: 0, background: swatchBackground({ hex, hex2, swatchUrl }) }} />;
}

// namePT/nameEN: bilingual display name (2026-07-25). hex/hex2: hex2 is
// only sent to the API when `combo` is checked -- it's the two-tone
// combination colour case (e.g. red & white), rendered as a split circle.
// noHex: patterned fabric, relies on a swatch image uploaded in the CMS
// admin instead (mutually exclusive with combo).
//
// nameSource tracks WHO last set namePT/nameEN, not just whether they're
// blank (2026-07-25 bug fix): a hex-driven suggestion still leaves the
// fields non-empty, so an emptiness check alone made the very first
// suggestion "stick" and silently ignore every hex change after it --
// changing the colour no longer changed the name. 'auto' means the
// current text was suggested by us and stays live as the admin keeps
// picking hexes; 'manual' means the admin typed into a name field
// themselves, which freezes the suggestion. Clearing both name fields
// re-arms 'auto'. Editing an existing (already-named) colour starts
// 'manual' so a small hex tweak doesn't silently rename it.
type ColorDraft = { namePT: string; nameEN: string; hex: string; hex2: string; combo: boolean; noHex: boolean; nameSource: 'auto' | 'manual' };
const EMPTY_COLOR_DRAFT: ColorDraft = { namePT: '', nameEN: '', hex: '#C8A96A', hex2: '#F7F5F0', combo: false, noHex: false, nameSource: 'auto' };

function ColorsPanel({
  colors,
  setColors,
  usage,
  setError,
  lang,
}: {
  colors: ApiColor[];
  setColors: React.Dispatch<React.SetStateAction<ApiColor[]>>;
  usage: Map<string, number>;
  setError: (message: string | null) => void;
  lang: Lang;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<ColorDraft>(EMPTY_COLOR_DRAFT);
  const [newDraft, setNewDraft] = useState<ColorDraft>(EMPTY_COLOR_DRAFT);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(taxonomyErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  // Auto-suggests bilingual names from the chosen hex(es) as long as the
  // name is still in 'auto' mode -- i.e. the admin hasn't typed into a name
  // field themselves since the last time it was cleared (2026-07-25 bug
  // fix: checking emptiness alone made the FIRST suggestion permanent,
  // since it left the fields non-empty and every hex change after that was
  // silently ignored). Applies to both the single-colour and
  // two-tone-combination cases.
  const handleHexChange = (set: React.Dispatch<React.SetStateAction<ColorDraft>>, patch: Partial<ColorDraft>) => {
    set((d) => {
      const next = { ...d, ...patch };
      if (d.nameSource === 'manual') return next;
      const suggestion = suggestColorName(next.hex, next.combo ? next.hex2 : undefined);
      return suggestion ? { ...next, namePT: suggestion.namePT, nameEN: suggestion.nameEN, nameSource: 'auto' } : next;
    });
  };

  // Typing into a name field takes over from the auto-suggestion; clearing
  // both fields back to blank hands control back to it.
  const handleNameChange = (set: React.Dispatch<React.SetStateAction<ColorDraft>>, patch: Partial<Pick<ColorDraft, 'namePT' | 'nameEN'>>) => {
    set((d) => {
      const next = { ...d, ...patch };
      const bothBlank = !next.namePT.trim() && !next.nameEN.trim();
      return { ...next, nameSource: bothBlank ? 'auto' : 'manual' };
    });
  };

  const editorFields = (d: ColorDraft, set: React.Dispatch<React.SetStateAction<ColorDraft>>, namePrefix: string) => (
    <>
      <input aria-label={t('ariaPortuguese', lang, { prefix: namePrefix })} placeholder={t('namePlaceholderPT', lang)} value={d.namePT} onChange={(e) => handleNameChange(set, { namePT: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
      <input aria-label={t('ariaEnglishOptional', lang, { prefix: namePrefix })} placeholder={t('namePlaceholderEN', lang)} value={d.nameEN} onChange={(e) => handleNameChange(set, { nameEN: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
      {!d.noHex && (
        <>
          <input aria-label={t('ariaValue', lang, { prefix: namePrefix })} type="color" value={d.hex} onChange={(e) => handleHexChange(set, { hex: e.target.value })} style={{ width: 34, height: 30, padding: 2, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, cursor: 'pointer' }} />
          {d.combo && <input aria-label={t('ariaSecondValue', lang, { prefix: namePrefix })} type="color" value={d.hex2} onChange={(e) => handleHexChange(set, { hex2: e.target.value })} style={{ width: 34, height: 30, padding: 2, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, cursor: 'pointer' }} />}
          <label style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 9, fontWeight: 700, color: C.inkSoft, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={d.combo} onChange={(e) => handleHexChange(set, { combo: e.target.checked })} />
            {t('twoToneLabel', lang)}
          </label>
        </>
      )}
      <label style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 9, fontWeight: 700, color: C.inkSoft, whiteSpace: 'nowrap' }}>
        <input type="checkbox" checked={d.noHex} onChange={(e) => set((s) => ({ ...s, noHex: e.target.checked, combo: e.target.checked ? false : s.combo }))} />
        {t('patternLabel', lang)}
      </label>
    </>
  );

  return (
    <Panel title={t('coloursTitle', lang)} hint={t('coloursHint', lang)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {colors.map((color) => {
          const id = String(color.id);
          const count = usage.get(id) ?? 0;
          const swatch = resolveRef(color.swatch);
          const isEditing = editing === id;
          return (
            <div key={id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '7px 10px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>
              {isEditing ? (
                <>
                  {editorFields(draft, setDraft, t('colourNameAriaPrefix', lang))}
                  <SmallButton label={t('saveAction', lang)} disabled={busy || !draft.namePT.trim()} onClick={() => void run(async () => {
                    const updated = await adminUpdateColor(id, {
                      namePT: draft.namePT.trim(),
                      nameEN: draft.nameEN.trim() || undefined,
                      hex: draft.noHex ? null : draft.hex,
                      hex2: draft.noHex || !draft.combo ? null : draft.hex2,
                    });
                    setColors((prev) => prev.map((c) => (String(c.id) === id ? updated : c)));
                    setEditing(null);
                  }, t('couldntSaveColour', lang))} />
                  <SmallButton label={t('cancelAction', lang)} onClick={() => setEditing(null)} />
                </>
              ) : (
                <>
                  <ColorDot hex={color.hex} hex2={color.hex2} swatchUrl={swatch?.url} lang={lang} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: C.ink }}>
                    {colorLabel(color)}
                    {color.hex && <span style={{ fontSize: 9, fontWeight: 700, color: C.inkSoft, marginLeft: 6 }}>{color.hex}{color.hex2 ? ` / ${color.hex2}` : ''}</span>}
                  </div>
                  <UsageBadge count={count} lang={lang} />
                  <SmallButton
                    label={t('editAction', lang)}
                    disabled={busy}
                    onClick={() => {
                      setEditing(id);
                      setDraft({ namePT: color.namePT, nameEN: color.nameEN ?? '', hex: color.hex ?? '#C8A96A', hex2: color.hex2 ?? '#F7F5F0', combo: Boolean(color.hex2), noHex: !color.hex, nameSource: 'manual' });
                    }}
                  />
                  <SmallButton
                    label={t('deleteAction', lang)}
                    danger
                    disabled={busy || count > 0}
                    title={count > 0 ? t('usedByProductsTitle', lang, { n: count, s: count === 1 ? '' : 's' }) : undefined}
                    onClick={() => { if (window.confirm(t('deleteEntryConfirm', lang, { name: colorLabel(color) }))) void run(async () => { await adminDeleteColor(id); setColors((prev) => prev.filter((c) => String(c.id) !== id)); }, t('couldntDeleteInUseGeneric', lang)); }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
        {editorFields(newDraft, setNewDraft, t('newColourAriaPrefix', lang))}
        <SmallButton label={t('addAction', lang)} disabled={busy || !newDraft.namePT.trim()} onClick={() => void run(async () => {
          const created = await adminCreateColor({
            namePT: newDraft.namePT.trim(),
            nameEN: newDraft.nameEN.trim() || undefined,
            hex: newDraft.noHex ? undefined : newDraft.hex,
            hex2: newDraft.noHex || !newDraft.combo ? undefined : newDraft.hex2,
          });
          setColors((prev) => [...prev, created]);
          setNewDraft(EMPTY_COLOR_DRAFT);
        }, t('couldntCreateColour', lang))} />
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Size guides: named measurement charts (cm, language-neutral)
// ---------------------------------------------------------------------------

type GuideDraft = { name: string; rows: { size: string; bust: string; waist: string; hip: string; length: string }[] };

function toDraftRows(rows: ApiSizeGuideRow[]): GuideDraft['rows'] {
  return rows.map((row) => ({
    size: row.size,
    bust: row.bust != null ? String(row.bust) : '',
    waist: row.waist != null ? String(row.waist) : '',
    hip: row.hip != null ? String(row.hip) : '',
    length: row.length != null ? String(row.length) : '',
  }));
}

function fromDraftRows(rows: GuideDraft['rows']): Omit<ApiSizeGuideRow, 'id'>[] {
  return rows.map((row) => ({
    size: row.size,
    bust: row.bust.trim() === '' ? null : Number(row.bust),
    waist: row.waist.trim() === '' ? null : Number(row.waist),
    hip: row.hip.trim() === '' ? null : Number(row.hip),
    length: row.length.trim() === '' ? null : Number(row.length),
  }));
}

const DEFAULT_GUIDE_ROWS: GuideDraft['rows'] = ['S', 'M', 'L'].map((size) => ({ size, bust: '', waist: '', hip: '', length: '' }));

function SizeGuidesPanel({
  guides,
  setGuides,
  usage,
  setError,
  lang,
}: {
  guides: ApiSizeGuide[];
  setGuides: React.Dispatch<React.SetStateAction<ApiSizeGuide[]>>;
  usage: Map<string, number>;
  setError: (message: string | null) => void;
  lang: Lang;
}) {
  // editing === 'new' means a brand-new guide draft.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<GuideDraft>({ name: '', rows: DEFAULT_GUIDE_ROWS });
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(taxonomyErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const setRow = (index: number, key: keyof GuideDraft['rows'][number], value: string) =>
    setDraft((d) => ({ ...d, rows: d.rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)) }));

  const columnHeaders: { key: string; label: string }[] = [
    { key: 'size', label: t('sizeGuideColSize', lang) },
    { key: 'bust', label: t('sizeGuideColBust', lang) },
    { key: 'waist', label: t('sizeGuideColWaist', lang) },
    { key: 'hip', label: t('sizeGuideColHip', lang) },
    { key: 'length', label: t('sizeGuideColLength', lang) },
    { key: 'x', label: '' },
  ];

  const editorTable = (
    <div style={{ marginTop: 8 }}>
      <input placeholder={t('guideNamePlaceholder', lang)} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} style={{ ...inputStyle, width: '100%', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(4, 1fr) 28px', gap: 4, alignItems: 'center' }}>
        {columnHeaders.map((h) => (
          <div key={h.key} style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep }}>{h.label}{h.label && h.key !== 'size' ? t('cmSuffix', lang) : ''}</div>
        ))}
        {draft.rows.map((row, index) => (
          <FragmentRow key={index}>
            <select value={row.size} onChange={(e) => setRow(index, 'size', e.target.value)} style={{ ...inputStyle, padding: '7px 4px' }}>
              {ALL_SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {(['bust', 'waist', 'hip', 'length'] as const).map((key) => (
              <input key={key} aria-label={`${row.size} ${key}`} type="number" min="0" value={row[key]} onChange={(e) => setRow(index, key, e.target.value)} style={{ ...inputStyle, padding: '7px 6px' }} />
            ))}
            <button type="button" aria-label={t('removeRow', lang)} onClick={() => setDraft((d) => ({ ...d, rows: d.rows.filter((_, i) => i !== index) }))} style={{ color: C.inkSoft, fontWeight: 800 }}>×</button>
          </FragmentRow>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <SmallButton label={t('addRow', lang)} disabled={busy || draft.rows.length >= ALL_SIZES.length} onClick={() => setDraft((d) => ({ ...d, rows: [...d.rows, { size: 'M', bust: '', waist: '', hip: '', length: '' }] }))} />
        <SmallButton
          label={busy ? '…' : t('saveGuide', lang)}
          disabled={busy || !draft.name.trim() || draft.rows.length === 0}
          onClick={() => void run(async () => {
            const input = { name: draft.name.trim(), rows: fromDraftRows(draft.rows) };
            if (editing === 'new') {
              const created = await adminCreateSizeGuide(input);
              setGuides((prev) => [...prev, created]);
            } else if (editing) {
              const updated = await adminUpdateSizeGuide(editing, input);
              setGuides((prev) => prev.map((g) => (String(g.id) === editing ? updated : g)));
            }
            setEditing(null);
          }, t('couldntSaveGuide', lang))}
        />
        <SmallButton label={t('cancelAction', lang)} onClick={() => setEditing(null)} />
      </div>
    </div>
  );

  return (
    <Panel title={t('sizeGuidesTitle', lang)} hint={t('sizeGuidesHint', lang)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {guides.map((guide) => {
          const id = String(guide.id);
          const count = usage.get(id) ?? 0;
          return (
            <div key={id} style={{ padding: '7px 10px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: C.ink }}>
                  {guide.name}
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.inkSoft, marginLeft: 6 }}>{t('sizesCountLabel', lang, { n: guide.rows.length })}</span>
                </div>
                <UsageBadge count={count} lang={lang} />
                <SmallButton label={editing === id ? t('editingEllipsis', lang) : t('editAction', lang)} disabled={busy || editing === id} onClick={() => { setEditing(id); setDraft({ name: guide.name, rows: toDraftRows(guide.rows) }); }} />
                <SmallButton
                  label={t('deleteAction', lang)}
                  danger
                  disabled={busy || count > 0}
                  title={count > 0 ? t('usedByProductsTitle', lang, { n: count, s: count === 1 ? '' : 's' }) : undefined}
                  onClick={() => { if (window.confirm(t('deleteEntryConfirm', lang, { name: guide.name }))) void run(async () => { await adminDeleteSizeGuide(id); setGuides((prev) => prev.filter((g) => String(g.id) !== id)); }, t('couldntDeleteInUseGeneric', lang)); }}
                />
              </div>
              {editing === id && editorTable}
            </div>
          );
        })}
      </div>
      {editing === 'new' ? (
        <div style={{ padding: '7px 10px', marginTop: 10, borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>{editorTable}</div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <SmallButton label={t('newSizeGuide', lang)} disabled={busy} onClick={() => { setEditing('new'); setDraft({ name: '', rows: DEFAULT_GUIDE_ROWS }); }} />
        </div>
      )}
    </Panel>
  );
}

// Grid rows are laid out by the parent grid; this is just a keyed fragment.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
