import { useLocation } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { t } from '../i18n';

const TITLE_KEYS: Record<string, string> = {
  '/admin/analytics': 'comingSoonTitleAnalytics',
  '/admin/marketing': 'comingSoonTitleMarketing',
  '/admin/meta-ads': 'comingSoonTitleMetaAds',
  '/admin/inventario': 'comingSoonTitleInventory',
  '/admin/automacao': 'comingSoonTitleAutomation',
};

// Shared placeholder for every Phase 2/3-only admin section. These were
// fully wired to mock data in the original prototype, but per the locked
// Phase 1 scope (JOS-52) only the storefront + order/product/customer admin
// + WhatsApp order-notification foundation ship now. Rather than port
// screens that would look "live" but aren't backed by anything real, they
// collapse into this single honest placeholder.
export function ComingSoon() {
  const { lang } = useApp();
  const location = useLocation();
  const titleKey = TITLE_KEYS[location.pathname] ?? 'comingSoonTitleDefault';

  return (
    <div style={{ padding: '32px 36px', maxWidth: 480 }}>
      <div style={{ fontFamily: F.display, fontSize: 28, color: C.ink, marginBottom: 10 }}>{t(titleKey, lang)}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>
        {t('comingSoonBody', lang)}
      </div>
    </div>
  );
}
