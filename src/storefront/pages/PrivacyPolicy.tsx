import { t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { LegalPage } from './LegalPage';

export function PrivacyPolicy() {
  const { lang } = useApp();
  return (
    <LegalPage
      heading={t('privacyPolicyNav', lang)}
      loadingNotice={t('legalPageLoading', lang)}
      pendingNotice={t('legalPagePending', lang)}
      getTextPT={(c) => c.privacyPolicyTextPT}
      getTextEN={(c) => c.privacyPolicyTextEN}
    />
  );
}
