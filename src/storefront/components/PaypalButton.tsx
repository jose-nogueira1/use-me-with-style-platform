import { useEffect, useRef, useState } from 'react';
import { publicEnv } from '../../config/env';
import { createPaypalOrder, capturePaypalOrder, type CreateOrderInput } from '../../lib/api';

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
}: {
  buildOrderInput: () => CreateOrderInput;
  onSuccess: (orderNumber: string) => void;
  onError: (message: string) => void;
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

  useEffect(() => {
    if (!publicEnv.paypalClientId) {
      onError('PayPal ainda não está configurado.');
      return;
    }
    let cancelled = false;
    loadPaypalSdk(publicEnv.paypalClientId, 'EUR')
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => onError('Não foi possível carregar o PayPal.'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            input = buildOrderInput();
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
            onError('Não foi possível iniciar o pagamento PayPal.');
            throw err;
          }
        },
        onApprove: async (data: { orderID: string }) => {
          try {
            const result = await capturePaypalOrder(data.orderID);
            if (result.status === 'COMPLETED' && result.orderNumber) {
              onSuccess(result.orderNumber);
            } else {
              onError('Pagamento não confirmado. Tente novamente.');
            }
          } catch {
            onError('Não foi possível confirmar o pagamento PayPal.');
          }
        },
        onCancel: () => onError('Pagamento PayPal cancelado.'),
        onError: () => {
          // The SDK calls this on top of createOrder's own rejection --
          // skip it for our own validation failures (see
          // validationFailedRef above) so the actionable message survives.
          if (validationFailedRef.current) {
            validationFailedRef.current = false;
            return;
          }
          onError('Ocorreu um erro no PayPal.');
        },
      })
      .render(containerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return <div ref={containerRef} style={{ marginTop: 12, minHeight: 45 }} />;
}
