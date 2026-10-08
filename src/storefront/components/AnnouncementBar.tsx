import { useEffect, useState } from 'react';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchAnnouncementBar, type AnnouncementItem } from '../../lib/api';
import { readPrerenderAnnouncement, rememberAnnouncementForPrerender } from '../../lib/prerenderBootstrap';
import { announcementDuration, announcementEntries, announcementRepeat, splitAroundCode } from '../announcement';

// Scrolling bar above the header: the free-delivery message and, when the admin
// promotes one, a discount code. Content comes from the CMS (see
// fetchAnnouncementBar); until it arrives, or if it fails, nothing is rendered
// so the page never shifts or breaks. The track holds two identical groups and
// slides by half its width, which loops without a jump; the second group is
// hidden from assistive tech so each message is read once. Hover pauses it, and
// reduced-motion users get the messages as static centred text (App.tsx styles).
export function AnnouncementBar() {
  const { lang, market } = useApp();
  // Starts from the pre-rendered snapshot's items (see prerenderBootstrap) so the
  // bar doesn't blink out and back in while the page boots.
  const [items, setItems] = useState<AnnouncementItem[]>(() => readPrerenderAnnouncement(market));
  // The snapshot can be stale (the bar is edited in the admin without a deploy), so it
  // only holds the bar's place; nothing is shown until the current content has arrived.
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    let live = true;
    setFresh(false);
    fetchAnnouncementBar(market)
      .then((result) => {
        rememberAnnouncementForPrerender(market, result);
        if (live) { setItems(result); setFresh(true); }
      })
      .catch(() => { if (live) { setItems([]); setFresh(true); } });
    return () => { live = false; };
  }, [market]);

  const entries = announcementEntries(items, lang);
  if (!entries.length) return null;

  const texts = entries.map((entry) => entry.text);
  const repeat = announcementRepeat(entries.length);
  const group = Array.from({ length: repeat }, () => entries).flat();

  return (
    <div
      role="region"
      aria-label={lang === 'pt' ? 'Avisos' : 'Announcements'}
      className="ump-announce"
      aria-hidden={fresh ? undefined : true}
      style={{ background: C.black, color: C.onDark, borderBottom: '1px solid rgba(229, 194, 79, 0.25)', fontFamily: F.sans, visibility: fresh ? 'visible' : 'hidden' }}
    >
      <div className="ump-announce-track" style={{ animationDuration: `${announcementDuration(texts, repeat)}s` }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="ump-announce-group" aria-hidden={copy === 1 ? true : undefined}>
            {group.map((entry, index) => (
              <span key={index} className="ump-announce-item">
                <span aria-hidden="true" style={{ color: C.onDarkGold }}>✦</span>
                <span>
                  {splitAroundCode(entry.text, entry.code).map((part, i) =>
                    part.code ? <strong key={i} style={{ color: C.onDarkGold, fontWeight: 800 }}>{part.text}</strong> : part.text,
                  )}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
