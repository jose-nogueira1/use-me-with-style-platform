import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { C, F, formatKz, t } from '../../theme';
import { useApp, useFormatPrice } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductPhoto } from '../../components/ProductPhoto';
import { trackMetaEvent } from '../../lib/metaAnalytics';

// Placeholder for a price/line-item value that hasn't loaded for the
// current market yet -- see the `loading` usage below. Sizing is passed per
// call site rather than baked into .ump-skeleton so one utility class covers
// every shape (a name, a price, a quantity stepper) used on this page.
function SkeletonBar({ width, height = 13 }: { width: number; height?: number }) {
  return <span className="ump-skeleton" style={{ width, height, color: C.inkSoft }} />;
}

export function Cart() {
  const { market, lang, cart, dispatchCart } = useApp();
  const { products, loading } = useProducts(market, lang);
  const fmtPrice = useFormatPrice();
  const navigate = useNavigate();

  // A cart line whose product isn't in the current market's catalogue once
  // loading has genuinely finished (not just still in flight -- see the
  // `loading` guard) means one of two things happened: the product was
  // discontinued/unpublished entirely, or -- the market-switch case flagged
  // 2026-07-27 -- this is a cart carried over from the OTHER market (AO and
  // PT each have their own separately-stored cart, but an old session's
  // cart for a market can still reference a product that was never
  // available there, or has since been restricted to the other market via
  // availableAO/availablePT). Previously this line was just silently
  // dropped from the total with no trace and no cleanup -- the stale entry
  // stayed in localStorage and kept silently vanishing on every future
  // visit. Now it's actually removed from the cart (so it stops recurring)
  // and surfaced with a one-time notice, instead of a quietly-shrinking
  // total with no explanation.
  const [removedNotice, setRemovedNotice] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  useEffect(() => {
    if (loading) return;
    const staleIdxs = cart
      .map((item, idx) => (products.find((p) => p.id === item.id) ? -1 : idx))
      .filter((idx) => idx !== -1);
    if (staleIdxs.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemovedNotice(true);
    // Remove highest index first so earlier indices in the same pass stay
    // valid as each REMOVE shifts the array.
    [...staleIdxs].reverse().forEach((idx) => dispatchCart({ type: 'REMOVE', idx }));
  }, [cart, loading, products, dispatchCart]);

  if (cart.length === 0) {
    return (
      <div className="ump-form-width" style={{ padding: '60px 30px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 30, background: C.subtleBg }}>
          <ShoppingBag size={28} color={C.goldDeep} />
        </div>
        <h1 style={{ fontFamily: F.display, fontSize: 22, color: C.ink, margin: '0 0 8px', fontWeight: 800 }}>{t('cartEmpty', lang)}</h1>
        <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 24, lineHeight: 1.5 }}>{t('cartEmptyHint', lang)}</div>
        <Link
          to="/"
          style={{ padding: '12px 24px', background: C.ctaBg, border: `1px solid ${C.ctaBorder}`, color: C.onDarkGold, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 8, textDecoration: 'none' }}
        >
          {t('continueShopping', lang)}
        </Link>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, i) => {
    const p = products.find((p) => p.id === i.id);
    if (!p) return sum;
    return sum + (market === 'AO' ? p.priceKz : p.priceEur) * i.qty;
  }, 0);

  // Re-checks each cart line's stock for the CURRENT market -- a colour/size
  // that was in stock when added (possibly in the other market, or before
  // an admin adjusted stock) can be out of stock by the time the shopper
  // reaches the cart. Previously this was only ever caught at order-creation
  // time, after the shopper had already filled in the entire checkout form
  // (2026-07-27 market-switch follow-up). `!loading` guard matches the
  // stale-item cleanup effect above -- product data mid-fetch would
  // otherwise read as a false "0 in stock".
  const hasOutOfStockLine =
    !loading &&
    cart.some((item) => {
      const p = products.find((pp) => pp.id === item.id);
      if (!p) return false;
      const stock = p.variants.find((v) => v.color === item.color && v.size === item.size)?.stock ?? 0;
      return stock <= 0;
    });

  return (
    <div className="ump-cart-layout" style={{ background: C.paper }}>
      <div style={{ padding: '20px 20px 12px', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: F.display, fontSize: 24, color: C.ink, fontWeight: 800, margin: 0 }}>{t('cart', lang)}</h1>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
              {cart.length} {t(cart.length === 1 ? 'itemSingular' : 'itemPlural', lang)}
            </div>
          </div>
          {/* Clear-all (2026-07-27, user request): inline two-step confirm
              instead of a native window.confirm(), consistent with the rest
              of the app never using browser-native dialogs. */}
          {!confirmingClear ? (
            <button
              onClick={() => setConfirmingClear(true)}
              style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textDecoration: 'underline', whiteSpace: 'nowrap' }}
            >
              {t('clearCart', lang)}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: C.inkSoft }}>{t('clearCartConfirmQuestion', lang)}</span>
              <button
                onClick={() => {
                  dispatchCart({ type: 'CLEAR' });
                  setConfirmingClear(false);
                }}
                style={{ fontSize: 11, fontWeight: 800, color: C.dangerStrong, textDecoration: 'underline', whiteSpace: 'nowrap' }}
              >
                {t('clearCartConfirmYes', lang)}
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textDecoration: 'underline', whiteSpace: 'nowrap' }}
              >
                {t('clearCartConfirmCancel', lang)}
              </button>
            </div>
          )}
        </div>
        {/* Market-switch communication fix (2026-07-27): makes it explicit
            up front that this cart is scoped to the current market, so a
            shopper who switches markets and sees different contents reads
            it as "I'm in a different store" rather than "my cart glitched." */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: 8,
            padding: '4px 10px',
            borderRadius: 20,
            background: C.subtleBg,
            border: `1px solid ${C.ruleLight}`,
            fontSize: 10,
            fontWeight: 700,
            color: C.inkSoft,
          }}
        >
          {t('cartViewingMarketNotice', lang, { market: t(market === 'AO' ? 'angola' : 'portugal', lang) })}
        </div>
      </div>

      {removedNotice && (
        <div style={{ margin: '0 20px 12px', padding: '10px 12px', background: C.subtleBg, border: `1px solid ${C.ruleLight}`, borderRadius: 6, fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>
          {t('cartItemsRemovedUnavailable', lang)}
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        {cart.map((item, idx) => {
          const p = products.find((p) => p.id === item.id);
          if (!p) {
            // A missing match means one of two things: the product data for
            // this market/language is still in flight (loading -- e.g. right
            // after switching markets, see the subtotal/skeleton comment
            // below), or the product has genuinely been removed/discontinued
            // since it was added to the cart. Only the first case gets a
            // skeleton row; the second still silently drops the line, same
            // as before.
            if (!loading) return null;
            return (
              <div key={`${item.id}:${item.size}:${item.color}`} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: `1px solid ${C.ruleLight}` }}>
                <span className="ump-skeleton" style={{ width: 72, height: 88, flexShrink: 0, borderRadius: 6, color: C.inkSoft }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <SkeletonBar width={140} height={14} />
                    <div style={{ marginTop: 8 }}>
                      <SkeletonBar width={90} height={11} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonBar width={72} height={26} />
                    <SkeletonBar width={56} height={13} />
                  </div>
                </div>
              </div>
            );
          }
          const variantStock = p.variants.find((v) => v.color === item.color && v.size === item.size)?.stock ?? 0;
          const isOutOfStock = variantStock <= 0;
          const isLowStock = !isOutOfStock && variantStock < item.qty;

          return (
            <div key={`${item.id}:${item.size}:${item.color}`} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: `1px solid ${C.ruleLight}` }}>
              <div style={{ width: 72, height: 88, flexShrink: 0, borderRadius: 6, overflow: 'hidden' }}>
                <ProductPhoto tone={p.tone} radius={6} image={p.images[0]} variant="thumbnail" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: F.display, fontSize: 14, color: C.ink, fontWeight: 700 }}>{p.name}</div>
                    <button aria-label={`${lang === 'pt' ? 'Remover' : 'Remove'} ${p.name}`} onClick={() => dispatchCart({ type: 'REMOVE', idx })} style={{ color: C.inkSoft }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                    {/* item.color is the colour's stable row id (2026-07-25
                        bilingual follow-up), resolved to a localized label
                        here via the product's own colour list. */}
                    {item.size} · {p.colors.find((c) => c.id === item.color)?.name ?? item.color}
                  </div>
                  {/* Stock re-check for the CURRENT market (2026-07-27) --
                      this colour/size may have been in stock when added
                      (possibly under the other market, or before stock
                      changed) but isn't now. */}
                  {isOutOfStock && (
                    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: C.dangerStrong }}>{t('outOfStock', lang)}</div>
                  )}
                  {isLowStock && (
                    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: C.goldDeep }}>{t('fewLeftStock', lang, { n: variantStock })}</div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${C.fieldBorder}`, borderRadius: 6, padding: '4px 8px' }}>
                    <button aria-label={`${lang === 'pt' ? 'Diminuir quantidade de' : 'Decrease quantity of'} ${p.name}`} onClick={() => dispatchCart({ type: 'DEC', idx })}>
                      <Minus size={12} />
                    </button>
                    {/* Explicit colour (2026-07-30 dark-mode QA): with none
                        set this inherited the UA default black and vanished
                        against the dark page at 1.08:1. */}
                    <span style={{ fontSize: 12, minWidth: 14, textAlign: 'center', color: C.ink }}>{item.qty}</span>
                    <button
                      aria-label={`${lang === 'pt' ? 'Aumentar quantidade de' : 'Increase quantity of'} ${p.name}`}
                      onClick={() => dispatchCart({ type: 'INC', idx, max: variantStock })}
                      disabled={item.qty >= variantStock}
                      style={{ opacity: item.qty >= variantStock ? 0.35 : 1, cursor: item.qty >= variantStock ? 'default' : 'pointer' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{fmtPrice(p)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ump-cart-summary" style={{ padding: '0 20px' }}>
        {hasOutOfStockLine && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: C.dangerBg, color: C.danger, fontSize: 11, borderRadius: 6, lineHeight: 1.5 }}>
            {t('cartOutOfStockBlockNotice', lang)}
          </div>
        )}
        <div style={{ padding: 16, background: C.subtleBg, border: `1px solid ${C.ruleLight}`, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: C.inkSoft, marginBottom: 8 }}>
            <span>{t('subtotal', lang)}</span>
            {/* While the current market/language's product data is still
                loading, `subtotal` above is computed from whatever's in
                `products` so far -- for a page that stayed mounted through a
                market switch (e.g. following the footer's "Shop the X store"
                link into the cart), that can be empty or stale, silently
                pricing every unmatched line at 0 and showing a real-looking
                but wrong "0 Kz" total for the ~1-2 seconds the fetch is in
                flight (2026-07-26 QA pass). A skeleton makes it visibly
                "still loading" instead of "your cart is worth nothing". */}
            {loading ? <SkeletonBar width={70} /> : <span>{market === 'AO' ? `${formatKz(subtotal, lang)} Kz` : `€${subtotal.toFixed(2)}`}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 16 }}>
            <span>{t('total', lang)}</span>
            {loading ? <SkeletonBar width={90} height={16} /> : <span>{market === 'AO' ? `${formatKz(subtotal, lang)} Kz` : `€${subtotal.toFixed(2)}`}</span>}
          </div>
          <button
            disabled={loading || hasOutOfStockLine}
            onClick={() => {
              trackMetaEvent('InitiateCheckout', {
                content_ids: cart.map((item) => item.id),
                content_type: 'product',
                num_items: cart.reduce((sum, item) => sum + item.qty, 0),
                value: subtotal,
                currency: market === 'AO' ? 'AOA' : 'EUR',
              });
              navigate('/checkout');
            }}
            style={{
              width: '100%',
              padding: 14,
              background: loading || hasOutOfStockLine ? C.disabledBg : C.ctaBg,
              border: `1px solid ${loading || hasOutOfStockLine ? C.disabledBg : C.ctaBorder}`,
              color: loading || hasOutOfStockLine ? C.disabledFg : C.onDarkGold,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              borderRadius: 8,
              cursor: loading || hasOutOfStockLine ? 'default' : 'pointer',
            }}
          >
            {t('checkout', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
