import { t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { LegalPage } from './LegalPage';
import { withApprovedTermsPaymentCopy } from '../../lib/legalCopy';

export function Terms() {
  const { lang } = useApp();
  return (
    <LegalPage
      heading={t('termsNav', lang)}
      loadingNotice={t('legalPageLoading', lang)}
      pendingNotice={t('legalPagePending', lang)}
      getTextPT={(c) => withApprovedTermsPaymentCopy(c.termsTextPT, 'pt')}
      getTextEN={(c) => withApprovedTermsPaymentCopy(c.termsTextEN, 'en')}
    />
  );
}
