import { useEffect, useState } from 'react';
import { publicEnv } from '../../config/env';

const SCRIPT_ID = 'appyPay-charges-widget-v2';
const WIDGET_SRC = 'https://widget.appypay.co.ao/main.js';

type AppyPayWidgetProps = {
  amount: number;
  description: string;
  merchantTransactionId: string;
  phoneNumber: string;
  lang: 'pt' | 'en';
};

/**
 * AppyPay's hosted Charges Widget reads its configuration from data
 * attributes on the script tag. Mount it only after our pending order has
 * been created, so merchantTransactionId always maps to a real CMS order.
 */
export function AppyPayWidget({
  amount,
  description,
  merchantTransactionId,
  phoneNumber,
  lang,
}: AppyPayWidgetProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    document.getElementById(SCRIPT_ID)?.remove();

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = WIDGET_SRC;
    script.async = true;
    script.dataset.merchantName = publicEnv.appyPayMerchantName;
    script.dataset.apiKey = publicEnv.appyPayApiKey;
    script.dataset.clientId = publicEnv.appyPayClientId;
    script.dataset.requestType = 'sync';
    script.dataset.paymentAmount = String(amount);
    script.dataset.paymentDescription = description;
    script.dataset.phoneNumber = phoneNumber.replace(/\D/g, '');
    script.dataset.merchantTxId = merchantTransactionId;
    script.dataset.lang = lang === 'en' ? 'en' : 'pt-PT';
    script.onerror = () => setLoadFailed(true);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [amount, description, merchantTransactionId, phoneNumber, lang]);

  if (loadFailed) {
    return <p role="alert">Não foi possível carregar o pagamento AppyPay. Tente novamente.</p>;
  }

  return <div aria-live="polite">A carregar o pagamento Multicaixa Express…</div>;
}
