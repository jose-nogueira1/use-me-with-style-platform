import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp, useFormatOriginalPrice, useFormatPrice } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductPhoto } from '../../components/ProductPhoto';

// Site-wide search, reachable from the header on every page including the
// homepage (2026-08-08: "I noticed we don't have a search option in the
// homepage"). Lives as a dropdown panel directly under the header rather
// than a full navigation, so a shopper gets live results as they type
// without leaving the page they're on -- StorefrontLayout renders this and
// owns the open/closed state (see its header-outside-click/Escape/route-
// change handling, the same pattern already used there for the language
// dropdown and mobile menu).
//
// Reuses `useProducts` (the same module-scoped, market+lang-cached catalogue
// Home/Browse/Cart already pull from) and the exact same case-insensitive
// name-substring match Browse.tsx's own search box uses, so the live preview
// here and the full results on /catalogo?q=... never disagree with each
// other. Capped at MAX_RESULTS -- this is a quick preview, not a second
// catalogue page; "see all N results" hands off to the real one.
const MAX_RESULTS = 6;

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, market } = useApp();
  const navigate = useNavigate();
  const { products } = useProducts(market, lang);
  const fmtPrice = useFormatPrice();
  const fmtOriginalPrice = useFormatOriginalPrice();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fresh slate every time the panel opens, and autofocus so typing can
  // start immediately -- matches the tile-open resets already established
  // in InstagramFeed.tsx's lightbox for the same reason (avoid carrying
  // stale state from a previous open into this one).
  // Resetting for a fresh open (an external event, not a derived-from-props
  // value) is exactly what this effect is for -- see InstagramFeed.tsx's
  // tile onClick for the same reset-on-reopen reasoning applied inline there
  // instead of in an effect.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery('');
    // Autofocus needs to happen after the panel has actually mounted into
    // the DOM this render -- a plain synchronous focus() call here would
    // sometimes run before the input exists yet on the very first open.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const trimmed = query.trim();
  const matches = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, trimmed]);
  const results = matches.slice(0, MAX_RESULTS);
  const seeAllHref = `/catalogo?q=${encodeURIComponent(trimmed)}`;

  if (!open) return null;

  return (
    <div className="ump-search-panel" role="search">
      <div className="ump-content-width" style={{ padding: '14px 20px 20px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color={C.inkSoft} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            // Plain text, not type="search" -- WebKit renders its own
            // built-in clear ("x") button for type="search" inputs, which
            // would sit right on top of the custom close button below.
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && trimmed) {
                navigate(seeAllHref);
                onClose();
              }
            }}
            placeholder={t('searchProducts', lang)}
            aria-label={t('navSearch', lang)}
            style={{
              width: '100%',
              height: 44,
              padding: '0 40px',
              borderRadius: 10,
              border: `1px solid ${C.fieldBorder}`,
              background: C.paper,
              color: C.ink,
              fontSize: 14,
            }}
          />
          <button
            type="button"
            aria-label={t('closeSearch', lang)}
            onClick={onClose}
            style={{
              position: 'absolute', right: 8,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 999, border: 'none', background: 'transparent', color: C.inkSoft, cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {trimmed && (
          results.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    to={`/produto/${product.slug}`}
                    onClick={onClose}
                    style={{
                      display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr)', gap: 12, alignItems: 'center',
                      padding: '8px 6px', borderRadius: 8, textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <div style={{ width: 48, height: 60, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                      <ProductPhoto tone={product.tone} radius={6} image={product.images[0]} variant="thumbnail" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 800, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </div>
                      <div style={{ marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        {product.onSale && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.inkSoft, textDecoration: 'line-through' }}>
                            {fmtOriginalPrice(product)}
                          </span>
                        )}
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: product.onSale ? C.dangerStrong : C.ink }}>
                          {fmtPrice(product)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {matches.length > results.length && (
                <Link
                  to={seeAllHref}
                  onClick={onClose}
                  style={{
                    display: 'block', marginTop: 10, padding: '10px 6px', textAlign: 'center',
                    fontSize: 11.5, fontWeight: 800, letterSpacing: 0.3, color: C.goldDeep, textDecoration: 'none',
                    borderTop: `1px solid ${C.ruleLight}`,
                  }}
                >
                  {t('searchSeeAllResults', lang, { count: matches.length, term: trimmed })}
                </Link>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 14, padding: '10px 6px', fontSize: 12.5, color: C.inkSoft }}>
              {t('searchNoResults', lang, { term: trimmed })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
