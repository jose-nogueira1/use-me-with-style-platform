import { Bell, Search } from 'lucide-react';
import { C, F } from '../../theme';

// Every admin screen in the Figma design shares this exact header pattern:
// a small eyebrow breadcrumb, a large bold title, a one-line subtitle, and a
// right-aligned action row (search icon, notify icon, one primary black CTA
// whose label changes per screen).
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  cta,
  onCta,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        flexWrap: 'wrap',
        padding: '24px 28px 0',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 4 }}>{eyebrow}</div>
        <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          aria-label="Search"
          style={{ width: 42, height: 42, borderRadius: 6, background: C.paper, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink }}
        >
          <Search size={15} />
        </button>
        <button
          aria-label="Notifications"
          style={{ width: 42, height: 42, borderRadius: 6, background: C.paper, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink }}
        >
          <Bell size={15} />
        </button>
        {cta && (
          <button
            onClick={onCta}
            style={{ padding: '0 20px', height: 42, borderRadius: 6, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}
