import { t, type Lang } from '../theme/i18n.ts';

const REASON_KEYS: Record<string, string> = {
  'Enter a code.': 'couponMissing',
  'This code was not found.': 'couponNotFound',
  'This code is no longer active.': 'couponInactive',
  'This code is not available in this market.': 'couponWrongMarket',
  'This code is not active yet.': 'couponNotStarted',
  'This code has expired.': 'couponExpired',
  'This code has reached its usage limit.': 'couponUsageLimit',
  'You have already used this code the maximum number of times.': 'couponCustomerLimit',
  'This code is not available for this order.': 'couponUnavailableOrder',
};

/** Translate the stable validation reasons returned by the CMS without
 * hiding an unexpected server message that may help diagnose a new rule. */
export function localizeCouponError(reason: string, lang: Lang): string {
  const key = REASON_KEYS[reason];
  if (key) return t(key, lang);

  const minimum = reason.match(/^This code requires a minimum order of (.+)\.$/);
  if (minimum) return t('couponMinimumOrder', lang, { amount: minimum[1] });

  return reason;
}
