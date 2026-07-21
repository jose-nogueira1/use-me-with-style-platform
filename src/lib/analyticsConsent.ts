export type AnalyticsConsent = 'accepted' | 'rejected';

const STORAGE_KEY = 'use-me-analytics-consent-v1';
export const ANALYTICS_CONSENT_EVENT = 'use-me:analytics-consent';

export function getAnalyticsConsent(): AnalyticsConsent | null {
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'accepted' || value === 'rejected' ? value : null;
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
  window.localStorage.setItem(STORAGE_KEY, value);
  window.fbq?.('consent', value === 'accepted' ? 'grant' : 'revoke');
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }));
}

export function clearAnalyticsConsent() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: null }));
}

function cookie(name: string) {
  return document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function getMetaOrderContext() {
  return {
    analyticsConsent: getAnalyticsConsent() === 'accepted',
    metaFbp: cookie('_fbp'),
    metaFbc: cookie('_fbc'),
    metaEventSourceUrl: window.location.href,
  };
}
