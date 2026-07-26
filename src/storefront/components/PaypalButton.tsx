import { useEffect, useRef, useState } from 'react';
import { publicEnv } from '../../config/env';
import { createPaypalOrder, capturePaypalOrder, type CreateOrderInput } from '../../lib/api';
import { t, type Lang } from '../../theme';

// Real PayPal integration (JOS-61) -- hand-rolled SDK loader (no
// @paypal/react-paypal-js dependency) to match this project's existing
// preference for small, hand-written wrappers over pulling in extra
// packages (see lib/api.ts). Renders PayPal's own Buttons widget, which
// calls back into our server for both steps: `createOrder` creates the
// order (pending) + a real PayPal order, `onApprove` captures it. The order
// is only ever marked paid server-side, after PayPal confirms the capture --
// never optimistically here.

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (el: HTMLElement) => void };
    };
  }
}

let sdkPromise: Promise<void> | null = null;

function loadPaypalSdk(clientId: string, currency: string): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.body.appendChild(script);
  });
  return sdkPromise;
}

export function PaypalButton({
  buildOrderInput,
  onSuccess,
  onError,
  lang,
}: {
  buildOrderInput: () => CreateOrderInput;
  onSuccess: (orderNumber: string) => void;
  onError: (message: string) => void;
  lang: Lang;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // Tracks whether the button's createOrder rejected because our own
  // required-field validation failed (buildOrderInput throws in that case)
  // -- Checkout already set a specific, actionable error message for that,
  // so the generic handlers below must not stomp it with a vague PayPal
  // error. Without this, "click Pay with PayPal before filling the form"
  // silently overwrites "Please fill in all required fields" with "Ocorreu
  // um erro no PayPal", making a client-side validation issue look like a
  // broken PayPal integration (the popup opens optimistically, createOrder
  // rejects instantly, PayPal closes it -- zero network calls, no useful
  // message left on screen).
  const validationFailedRef = useRef(false);

  // THE actual root cause of "PayPal button does nothing, zero network
  // calls, no matter what's in the form": the effect below that calls
  // `window.paypal.Buttons(...).render(...)` only depends on `[ready]`, so
  // it runs once, right after the SDK loads (near mount) -- and the
  // `createOrder`/`onApprove`/etc closures it creates capture whatever
  // `buildOrderInput`/`onSuccess`/`onError` were AT THAT MOMENT. Checkout
  // re-renders on every keystroke with a *new* `buildOrderInputForPaypal`
  // closing over the latest `form` state, but the PayPal button itself is
  // never re-rendered to pick that up -- it keeps calling the original,
  // stale closure forever, which always sees the empty `form` from
  // mount-time. That's why validation always "failed" (silently, with zero
  // requests) regardless of what was actually typed into the form, in both
  // automated and real manual test attempts this session. Fix: keep the
  // latest callbacks in refs, updated every render, and have the Buttons
  // instance (created once) call through the refs instead of closing over
  // the props directly.
  const buildOrderInputRef = useRef(buildOrderInput);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const langRef = useRef(lang);

  useEffect(() => {
    buildOrderInputRef.current = buildOrderInput;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    langRef.current = lang;
  }, [buildOrderInput, onSuccess, onError, lang]);

  useEffect(() => {
    if (!publicEnv.paypalClientId) {
      onErrorRef.current(t('paypalUnavailable', langRef.current));
      return;
    }
    let cancelled = false;
    loadPaypalSdk(publicEnv.paypalClientId, 'EUR')
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => onErrorRef.current(t('paypalLoadFailed', langRef.current)));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !window.paypal || !containerRef.current) return;
    containerRef.current.innerHTML = '';

    window.paypal
      .Buttons({
        style: { layout: 'vertical', label: 'pay' },
        createOrder: async () => {
          validationFailedRef.current = false;
          let input: CreateOrderInput;
          try {
            input = buildOrderInputRef.current();
          } catch (err) {
            // Required-field validation failed -- Checkout's
            // buildOrderInputForPaypal already called setError() with the
            // right message. Reject without touching it.
            validationFailedRef.current = true;
            throw err;
          }
          try {
            const { paypalOrderId } = await createPaypalOrder(input);
            return paypalOrderId;
          } catch (err) {
            onErrorRef.current(t('paypalStartFailed', langRef.current));
            throw err;
          }
        },
        onApprove: async (data: { orderID: string }) => {
          try {
            const result = await capturePaypalOrder(data.orderID);
            if (result.status === 'COMPLETED' && result.orderNumber) {
              onSuccessRef.current(result.orderNumber);
            } else {
              onErrorRef.current(t('paypalNotConfirmed', langRef.current));
            }
          } catch {
            onErrorRef.current(t('paypalConfirmFailed', langRef.current));
          }
        },
        onCancel: () => onErrorRef.current(t('paypalCancelled', langRef.current)),
        onError: () => {
          // The SDK calls this on top of createOrder's own rejection --
          // skip it for our own validation failures (see
          // validationFailedRef above) so the actionable message survives.
          if (validationFailedRef.current) {
            validationFailedRef.current = false;
            return;
          }
          onErrorRef.current(t('paypalGenericError', langRef.current));
        },
      })
      .render(containerRef.current);
  }, [ready]);

  return <div ref={containerRef} style={{ marginTop: 12, minHeight: 45 }} />;
}
