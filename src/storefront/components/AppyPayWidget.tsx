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
  attempt: number;
  onStateChange: (state: 'loading' | 'ready' | 'failed') => void;
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
  attempt,
  onStateChange,
}: AppyPayWidgetProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stateChangeRef = useRef(onStateChange);

  useEffect(() => {
    stateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;

    setLoadFailed(false);
    stateChangeRef.current('loading');
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

    const style = frameDocument.createElement('style');
    style.textContent = `
      html, body { margin: 0; min-height: 100%; background: #fff; color: #171714; }
      body { padding: 0; overflow-x: hidden; font-family: Arial, sans-serif; }
      #${CONTAINER_ID} { min-height: 420px; }
    `;
    frameDocument.head.appendChild(style);

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
    const markFailed = () => {
      setLoadFailed(true);
      stateChangeRef.current('failed');
    };
    script.onerror = markFailed;
    frameDocument.head.appendChild(script);

    const observer = new MutationObserver(() => {
      const hasInteractiveContent = Boolean(
        container.querySelector('button, input, form, iframe, select, [role="button"], [class]'),
      );
      if (hasInteractiveContent) stateChangeRef.current('ready');
    });
    observer.observe(container, { childList: true, subtree: true, attributes: true });
    const timeout = window.setTimeout(() => {
      const hasInteractiveContent = Boolean(
        container.querySelector('button, input, form, iframe, select, [role="button"], [class]'),
      );
      if (!hasInteractiveContent) markFailed();
    }, 12_000);

    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      script.remove();
    };
  }, [amount, attempt, description, merchantTransactionId, phoneNumber, lang]);

  if (loadFailed) {
    return null;
  }

  // AppyPay injects unscoped styles for body, headings, links, and buttons.
  // A same-origin frame contains those styles while preserving the hosted
  // widget's normal script configuration and payment flow.
  //
  // Height was a flat 720px regardless of viewport (2026-07-24, responsive
  // audit, Finding 6) -- on a short viewport (landscape phone, a laptop with
  // a lot of browser chrome) that forced a lot of scrolling just to reach
  // the widget's own payment buttons, which sit near the bottom of its
  // (assumed) 720px design. min(720px, 85vh) keeps the exact same 720px on
  // any normal-height screen (no regression there) while capping it to 85%
  // of the visible viewport on short ones; the iframe's own content scrolls
  // internally if AppyPay's widget ends up taller than that.
  return (
    <iframe
      ref={frameRef}
      title={lang === 'pt' ? 'Pagamento AppyPay' : 'AppyPay payment'}
      style={{ display: 'block', width: '100%', height: 'clamp(420px, 58vh, 560px)', border: 0, background: '#fff' }}
    />
  );
}
