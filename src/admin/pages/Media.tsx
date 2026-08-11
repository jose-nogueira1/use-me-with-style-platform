import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminDeleteMedia,
  adminListCategories,
  adminListColors,
  adminListMedia,
  adminListProducts,
  adminUploadMedia,
  fetchHomeHero,
  type ApiMedia,
} from '../../lib/api';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import { imageOptimizationSummary, imageUploadGuidance, prepareImageUpload } from '../../lib/imageUpload';
import { buildMediaUsageIndex, type MediaUsageIndex } from '../mediaUsage';

// Standalone media library -- browse/upload/delete images independent of the
// per-product upload flow already in ProductEditor. Added 2026-07-25 for
// storefront-admin/Payload-admin parity (the Media collection previously had
// no storefront-admin UI of its own). Delete is included per the 2026-07-25
// decision to add it for Products and Media specifically (low-risk, catalogue
// cleanup is routine) but not for Orders/Customers/Invoices.
export function Media() {
  const { lang } = useApp();
  const [items, setItems] = useState<ApiMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [usageIndex, setUsageIndex] = useState<MediaUsageIndex>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    Promise.all([adminListMedia(), adminListProducts(), adminListCategories(), adminListColors(), fetchHomeHero()])
      .then(([media, products, categories, colours, hero]) => {
        setItems(media);
        setUsageIndex(buildMediaUsageIndex(products, categories, colours, hero, lang));
      })
      .catch(() => setError(t('couldntConnectBackend', lang)));
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setUploadNotice(null);
    try {
      const prepared = await prepareImageUpload(file, 'catalogue', lang);
      await adminUploadMedia(prepared.file, file.name.replace(/\.[^.]+$/, ''));
      setUploadNotice(imageOptimizationSummary(prepared, lang));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('couldntUploadFile', lang));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: ApiMedia) => {
    const usages = usageIndex.get(String(item.id)) ?? [];
    if (usages.length > 0) return;
    if (!window.confirm(t('deleteMediaConfirm', lang, { name: item.alt || item.filename || '' }))) return;
    setError(null);
    try {
      await adminDeleteMedia(item.id);
      setItems((prev) => (prev ? prev.filter((m) => m.id !== item.id) : prev));
    } catch {
      setError(t('couldntDeleteInUse', lang));
    }
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('settingsMedia', lang)}
        title={t('mediaLibraryTitle', lang)}
        subtitle={t('mediaLibrarySubtitle', lang)}
        cta={uploading ? t('uploadingEllipsis', lang) : t('uploadImage', lang)}
        onCta={() => fileInputRef.current?.click()}
      />
      <div
        style={{
          margin: '14px 28px 0',
          padding: '10px 12px',
          fontSize: 11,
          lineHeight: 1.5,
          color: C.inkSoft,
          background: C.subtleBg,
          border: `1px solid ${C.ruleLight}`,
          borderRadius: 6,
        }}
      >
        {imageUploadGuidance('catalogue', lang)}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => void handleUpload(e.target.files?.[0])} />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}
      {uploadNotice && <div style={{ margin: '16px 28px 0', fontSize: 12, color: '#3F754D' }}>{uploadNotice}</div>}
      {items && items.length === 0 && <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('noMediaYet', lang)}</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }} className="ump-admin-media-grid">
        {(items ?? []).map((item) => {
          const usages = usageIndex.get(String(item.id)) ?? [];
          return (
          <div key={item.id} style={{ background: C.paper, border: `1px solid ${usages.length ? C.goldDeep : C.ruleLight}`, borderRadius: 8, padding: 10 }}>
            <div style={{ height: 130, borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.rule}`, overflow: 'hidden' }}>
              {(() => {
                // Bug (2026-07-31, admin report: "Media tab is not showing
                // the image"): Payload returns media URLs as paths relative
                // to the CMS origin (e.g. /media/foo.png), not the admin
                // site's own origin -- every other image in the admin/
                // storefront already resolves through absoluteMediaUrl()
                // (see ProductEditor, Settings.tsx's hero image, etc.) but
                // this grid rendered the raw relative path directly, which
                // 404s (or resolves against the wrong origin) in the
                // browser.
                const src = absoluteMediaUrl(item.sizes?.thumbnail?.url ?? item.url);
                return src ? <img src={src} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null;
              })()}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.alt || item.filename || t('untitledMedia', lang)}
            </div>
            <div style={{ marginTop: 7, fontSize: 9, fontWeight: 800, color: usages.length ? C.goldDeep : C.inkSoft }}>
              {usages.length
                ? t(usages.length === 1 ? 'mediaUsedOnce' : 'mediaUsedMultiple', lang, { n: usages.length })
                : t('mediaUnused', lang)}
            </div>
            {usages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {usages.map((usage) => (
                  <Link key={usage.key} to={usage.href} style={{ fontSize: 9, lineHeight: 1.35, color: C.goldDeep, fontWeight: 700, textDecoration: 'underline' }}>
                    {usage.label}
                  </Link>
                ))}
              </div>
            )}
            <button
              onClick={() => handleDelete(item)}
              disabled={usages.length > 0}
              title={usages.length > 0 ? t('mediaDeleteBlockedTitle', lang) : undefined}
              style={{ width: '100%', marginTop: 8, padding: '7px 0', fontSize: 10, fontWeight: 800, color: usages.length ? C.inkSoft : '#B95545', border: `1px solid ${usages.length ? C.rule : '#E1B3AA'}`, borderRadius: 6, background: 'transparent', cursor: usages.length ? 'not-allowed' : 'pointer', opacity: usages.length ? 0.65 : 1 }}
            >
              {usages.length ? t('mediaInUseAction', lang) : t('deleteAction', lang)}
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}
