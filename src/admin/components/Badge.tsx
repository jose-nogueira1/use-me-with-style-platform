import { C } from '../../theme';
import { t, type Lang } from '../i18n';

// Status/badge pill matching the Figma admin design system. Every badge on
// every admin screen (Dashboard, Orders, Products, Settings, Messaging) uses
// one of these five tone pairings -- see the recurring "Badge / X" nodes.
export type BadgeTone = 'neutral' | 'gold' | 'blue' | 'green' | 'red' | 'dark';

const TONE_STYLE: Record<BadgeTone, { bg: string; border: string; text: string }> = {
  neutral: { bg: C.paper, border: C.rule, text: C.ink },
  gold: { bg: C.tagBg, border: '#E8D28D', text: C.goldDeep },
  blue: { bg: '#EDF4F3', border: '#B8D2D0', text: C.blue },
  green: { bg: '#EFF4EC', border: '#BFD3B6', text: '#3F754D' },
  red: { bg: '#FFF0EB', border: '#E1B3AA', text: '#B95545' },
  dark: { bg: C.black, border: C.black, text: C.onDarkGold },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const s = TONE_STYLE[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 10px',
        borderRadius: 6,
        fontSize: 9,
        fontWeight: 800,
        whiteSpace: 'nowrap',
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
      }}
    >
      {label}
    </span>
  );
}

// Maps the backend order/message status strings to a badge tone + i18n key,
// used consistently across Dashboard, Orders queue, Order detail, and
// Mensagens so a given status always reads the same way. Kept beside Badge
// so every status consumer uses the same visual mapping. Callers resolve the
// label via t(key, lang) themselves (statusBadgeProps has no lang of its own).
// eslint-disable-next-line react-refresh/only-export-components
export function statusBadgeProps(status: string, lang: Lang): { label: string; tone: BadgeTone } {
  switch (status) {
    case 'new':
      return { label: t('statusNew', lang), tone: 'neutral' };
    case 'payment_review':
      return { label: t('statusPaymentReview', lang), tone: 'gold' };
    case 'processing':
      return { label: t('statusProcessing', lang), tone: 'blue' };
    case 'shipped':
      return { label: t('statusShipped', lang), tone: 'green' };
    case 'delivered':
      return { label: t('statusDelivered', lang), tone: 'green' };
    case 'cancelled':
      return { label: t('statusCancelled', lang), tone: 'neutral' };
    default:
      return { label: status, tone: 'neutral' };
  }
}
