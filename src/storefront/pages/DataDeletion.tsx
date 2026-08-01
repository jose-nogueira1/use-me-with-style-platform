import { t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { LegalPage } from './LegalPage';

// Data Deletion Instructions page (added 2026-08-01) -- required by the Meta
// App Dashboard's "Data Deletion Instructions URL" field to publish the
// WhatsApp/Instagram messaging app (JOS-58). Same shared LegalPage renderer
// and CMS-driven bilingual text pattern as PrivacyPolicy.tsx/Terms.tsx.
export function DataDeletion() {
  const { lang } = useApp();
  return (
    <LegalPage
      heading={t('dataDeletionNav', lang)}
      loadingNotice={t('legalPageLoading', lang)}
      pendingNotice={t('legalPagePending', lang)}
      getTextPT={(c) => c.dataDeletionTextPT}
      getTextEN={(c) => c.dataDeletionTextEN}
    />
  );
}
