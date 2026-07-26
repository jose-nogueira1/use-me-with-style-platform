import { useEffect, useRef, useState } from 'react';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminDeleteMedia, adminListMedia, adminUploadMedia, type ApiMedia } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    adminListMedia()
      .then(setItems)
      .catch(() => setError(t('couldntConnectBackend', lang)));
  };

  useEffect(load, []);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await adminUploadMedia(file, file.name.replace(/\.[^.]+$/, ''));
      load();
    } catch {
      setError(t('couldntUploadFile', lang));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: ApiMedia) => {
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
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => void handleUpload(e.target.files?.[0])} />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}
      {items && items.length === 0 && <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('noMediaYet', lang)}</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }} className="ump-admin-media-grid">
        {(items ?? []).map((item) => (
          <div key={item.id} style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 10 }}>
            <div style={{ height: 130, borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.rule}`, overflow: 'hidden' }}>
              {(item.sizes?.thumbnail?.url || item.url) && (
                <img src={item.sizes?.thumbnail?.url || item.url} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.alt || item.filename || t('untitledMedia', lang)}
            </div>
            <button
              onClick={() => handleDelete(item)}
              style={{ width: '100%', marginTop: 8, padding: '7px 0', fontSize: 10, fontWeight: 800, color: '#B95545', border: '1px solid #E1B3AA', borderRadius: 6, background: 'transparent' }}
            >
              {t('deleteAction', lang)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
