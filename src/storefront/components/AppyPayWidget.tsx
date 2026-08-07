import { useEffect, useRef, useState } from 'react';
import { publicEnv } from '../../config/env';

const SCRIPT_ID = 'appyPay-charges-widget-v2';
const CONTAINER_ID = 'appyPay-charges-v2';

// This mount pattern (own iframe + document.write + injected script tag) is
// not AppyPay's documented integration (a plain <script> in the host page's
// own <head> -- see their widget docs); it exists for CSS isolation (see the
// comment on the returned <iframe> below). That makes it a higher-risk
// integration point worth logging, not something to redesign before launch.
// No error-reporting service exists in this storefront yet (grepped for
// Sentry/Bugsnag/etc -- none), so this is plain console.error with a
// greppable prefix, same tier as the handful of other console.error calls
// already in Checkout.tsx.
function logAppyPayIssue(message: string, details: Record<string, unknown>) {
  console.error(`[appypay-widget] ${message}`, details);
}

type AppyPayWidgetProps = {
  amount: number;
  description: string;
  orderNumber: string;
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
  orderNumber,
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
    // Browser redirect target after the widget's own charge flow finishes --
    // NOT the transactional webhook (that's AppyPay-portal-configured,
    // POST-only, Basic-Auth-protected, and lives in the CMS). Built from
    // window.location.origin so it always lands back on whichever market
    // subdomain (ao./pt.) the customer is actually on, carrying the order
    // number the confirmation page looks status up by.
    const redirectUri = `${window.location.origin}/encomenda-confirmada/${encodeURIComponent(orderNumber)}`;
    script.dataset.redirectUri = redirectUri;
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
    const logContext = { orderNumber, merchantTransactionId, attempt };
    const markFailed = () => {
      setLoadFailed(true);
      stateChangeRef.current('failed');
    };
    script.onerror = (event) => {
      logAppyPayIssue('script failed to load', { ...logContext, src: script.src, event: String(event) });
      markFailed();
    };
    frameDocument.head.appendChild(script);

    // AppyPay's script (widget-tst.appypay.co.ao / widget.appypay.co.ao) is
    // cross-origin, so the browser redacts most detail from errors it
    // throws after load (typically just "Script error." with no
    // filename/lineno/stack) unless AppyPay sends CORS headers we don't
    // control. Logged anyway -- even a bare signal that *something* broke
    // inside the widget after it reported ready (mid-interaction, e.g.
    // while the customer is filling in a phone number or generating a
    // reference) is strictly better than the current total silence: today
    // nothing here watches for this at all, so a runtime error deep in
    // AppyPay's bundle would leave the customer stuck on an unresponsive
    // widget with neither them nor us knowing why. Log-only, no state
    // change -- forcing the whole modal into the "failed, please retry"
    // state on any stray script error (including ones unrelated to the
    // actual payment flow) risks interrupting a payment that's still fine.
    const frameWindow = frameRef.current?.contentWindow;
    const onFrameError = (event: ErrorEvent) => {
      logAppyPayIssue('runtime error inside widget iframe', {
        ...logContext,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    };
    const onFrameRejection = (event: PromiseRejectionEvent) => {
      logAppyPayIssue('unhandled promise rejection inside widget iframe', {
        ...logContext,
        reason: String(event.reason),
      });
    };
    frameWindow?.addEventListener('error', onFrameError);
    frameWindow?.addEventListener('unhandledrejection', onFrameRejection);

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
      if (!hasInteractiveContent) {
        logAppyPayIssue('widget did not report ready within 12s', logContext);
        markFailed();
      }
    }, 12_000);

    // AppyPay's own script runs inside this iframe and completes the charge
    // flow with a plain `window.location.href = <redirectUri>` -- since that
    // `window` is the IFRAME's, not the top-level page, the navigation lands
    // *inside* the iframe instead of taking the customer to the confirmation
    // page. Verified empirically (2026-08-06, sandbox reference charge):
    // iframe.contentWindow navigated to the redirect URI while the tab's own
    // window.location stayed on /checkout, leaving the whole site rendered
    // inside the small modal iframe. Same-origin, so we can watch the
    // frame's own location and promote a landing on our redirect URI to a
    // real top-level navigation. Starts at "about:blank" (never assigned an
    // iframe.src) so this stays idle until AppyPay actually redirects.
    const redirectCheck = window.setInterval(() => {
      let frameHref: string | null = null;
      try {
        frameHref = frameRef.current?.contentWindow?.location.href ?? null;
      } catch {
        // frame briefly cross-origin (e.g. mid 3rd-party hop) -- keep polling
      }
      if (frameHref && frameHref.startsWith(redirectUri)) {
        window.clearInterval(redirectCheck);
        window.location.assign(frameHref);
      }
    }, 400);

    return () => {
      frameWindow?.removeEventListener('error', onFrameError);
      frameWindow?.removeEventListener('unhandledrejection', onFrameRejection);
      window.clearInterval(redirectCheck);
      window.clearTimeout(timeout);
      observer.disconnect();
      script.remove();
    };
  }, [amount, attempt, description, orderNumber, merchantTransactionId, phoneNumber, lang]);

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
