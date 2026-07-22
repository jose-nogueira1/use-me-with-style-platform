import { useEffect, useRef, useState } from 'react';
import { publicEnv } from '../../config/env';

const SCRIPT_ID = 'appyPay-charges-widget-v2';
const CONTAINER_ID = 'appyPay-charges-v2';
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
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;

    setLoadFailed(false);
    frameDocument.open();
    frameDocument.write('<!doctype html><html><head></head><body></body></html>');
    frameDocument.close();

    const viewport = frameDocument.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    frameDocument.head.appendChild(viewport);

    const container = frameDocument.createElement('div');
    container.id = CONTAINER_ID;
    container.setAttribute('aria-live', 'polite');
    container.textContent = lang === 'pt'
      ? 'A carregar Multicaixa Express e Referência…'
      : 'Loading Multicaixa Express and Reference…';
    frameDocument.body.appendChild(container);

    const script = frameDocument.createElement('script');
    script.id = SCRIPT_ID;
    script.src = publicEnv.appyPayWidgetSrc;
    script.async = true;
    script.dataset.merchantName = publicEnv.appyPayMerchantName;
    script.dataset.apiKey = publicEnv.appyPayApiKey;
    script.dataset.clientId = publicEnv.appyPayClientId;
    // Async is the authoritative AppyPay flow: the CMS receives a webhook
    // and verifies the charge server-to-server before it marks the AO order
    // paid. Widget completion alone never proves settlement.
    script.dataset.requestType = 'async';
    if (publicEnv.appyPayRedirectUri) {
      script.dataset.redirectUri = publicEnv.appyPayRedirectUri;
    }
    script.dataset.paymentAmount = String(amount);
    script.dataset.paymentDescription = description;
    script.dataset.phoneNumber = phoneNumber.replace(/\D/g, '');
    script.dataset.merchantTxId = merchantTransactionId;
    if (publicEnv.appyPayMerchantLogoUrl) {
      script.dataset.merchantLogoUrl = publicEnv.appyPayMerchantLogoUrl;
    }
    if (publicEnv.appyPayOptions) {
      script.dataset.options = publicEnv.appyPayOptions;
    }
    if (publicEnv.appyPayPaymentMethods) {
      script.dataset.paymentMethods = publicEnv.appyPayPaymentMethods;
    }
    script.dataset.lang = lang === 'en' ? 'en' : 'pt-PT';
    script.onerror = () => setLoadFailed(true);
    frameDocument.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [amount, description, merchantTransactionId, phoneNumber, lang]);

  if (loadFailed) {
    return <p role="alert">{lang === 'pt' ? 'Não foi possível carregar o pagamento AppyPay. Tente novamente.' : 'AppyPay could not be loaded. Please try again.'}</p>;
  }

  // AppyPay injects unscoped styles for body, headings, links, and buttons.
  // A same-origin frame contains those styles while preserving the hosted
  // widget's normal script configuration and payment flow.
  return (
    <iframe
      ref={frameRef}
      title={lang === 'pt' ? 'Pagamento AppyPay' : 'AppyPay payment'}
      style={{ display: 'block', width: '100%', height: 720, border: 0 }}
    />
  );
}
