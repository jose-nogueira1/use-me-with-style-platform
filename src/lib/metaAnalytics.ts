import { publicEnv } from '../config/env';
import { getAnalyticsConsent } from './analyticsConsent';

type MetaEventParams = Record<string, string | number | string[] | undefined>;
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string };
    _fbq?: Fbq;
  }
}

let initialized = false;

function enabled() {
  return publicEnv.analyticsEnabled && Boolean(publicEnv.metaPixelId) && getAnalyticsConsent() === 'accepted';
}

function ensurePixel() {
  if (!enabled()) return false;
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    } as NonNullable<Window['fbq']>;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    window._fbq = fbq;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  if (!initialized) {
    window.fbq?.('init', publicEnv.metaPixelId);
    initialized = true;
  }
  return true;
}

function eventId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cookie(name: string) {
  return document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function trackMetaEvent(name: string, params: MetaEventParams = {}) {
  if (!ensurePixel()) return;
  const id = eventId();
  window.fbq?.('track', name, params, { eventID: id });
  void fetch(`${publicEnv.apiBaseUrl.replace(/\/$/, '')}/api/meta/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analyticsConsent: true,
      eventName: name,
      eventId: id,
      eventSourceUrl: window.location.href,
      customData: params,
      fbp: cookie('_fbp'),
      fbc: cookie('_fbc'),
    }),
    keepalive: true,
  }).catch(() => undefined);
}

/** Consent-aware custom events used for first-party merchandising journeys
 * that do not map cleanly to Meta's standard commerce event names. */
export function trackMetaCustomEvent(name: 'ShopTheLookOpen' | 'ShopTheLookProductClick', params: MetaEventParams = {}) {
  if (!ensurePixel()) return;
  const id = eventId();
  window.fbq?.('trackCustom', name, params, { eventID: id });
  void fetch(`${publicEnv.apiBaseUrl.replace(/\/$/, '')}/api/meta/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analyticsConsent: true,
      eventName: name,
      eventId: id,
      eventSourceUrl: window.location.href,
      customData: params,
      fbp: cookie('_fbp'),
      fbc: cookie('_fbc'),
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export function trackPageView() {
  trackMetaEvent('PageView');
}
