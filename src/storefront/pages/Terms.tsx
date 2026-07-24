import { t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { LegalPage } from './LegalPage';

export function Terms() {
  const { lang } = useApp();
  return (
    <LegalPage
      heading={t('termsNav', lang)}
      loadingNotice={t('legalPageLoading', lang)}
      pendingNotice={t('legalPagePending', lang)}
      getTextPT={(c) => c.termsTextPT}
      getTextEN={(c) => c.termsTextEN}
    />
  );
}
