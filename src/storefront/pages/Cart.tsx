import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp, useFormatPrice } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductPhoto } from '../../components/ProductPhoto';
import { trackMetaEvent } from '../../lib/metaAnalytics';

export function Cart() {
  const { market, lang, cart, dispatchCart } = useApp();
  const { products } = useProducts(market, lang);
  const fmtPrice = useFormatPrice();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="ump-narrow" style={{ padding: '60px 30px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 30, background: C.subtleBg }}>
          <ShoppingBag size={28} color={C.goldDeep} />
        </div>
        <div style={{ fontFamily: F.display, fontSize: 22, color: C.ink, marginBottom: 8, fontWeight: 800 }}>{t('cartEmpty', lang)}</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 24, lineHeight: 1.5 }}>{t('cartEmptyHint', lang)}</div>
        <Link
          to="/"
          style={{ padding: '12px 24px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 8, textDecoration: 'none' }}
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

  return (
    <div className="ump-narrow" style={{ background: C.paper }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontFamily: F.display, fontSize: 24, color: C.ink, fontWeight: 800 }}>{t('cart', lang)}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
          {cart.length} {t(cart.length === 1 ? 'itemSingular' : 'itemPlural', lang)}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {cart.map((item, idx) => {
          const p = products.find((p) => p.id === item.id);
          if (!p) return null;
          return (
            <div key={idx} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: `1px solid ${C.ruleLight}` }}>
              <div style={{ width: 72, height: 88, flexShrink: 0, borderRadius: 6, overflow: 'hidden' }}>
                <ProductPhoto tone={p.tone} radius={6} image={p.images[0]} variant="thumbnail" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: F.display, fontSize: 14, color: C.ink, fontWeight: 700 }}>{p.name}</div>
                    <button onClick={() => dispatchCart({ type: 'REMOVE', idx })} style={{ color: C.inkSoft }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                    {item.size} · {item.color}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '4px 8px' }}>
                    <button onClick={() => dispatchCart({ type: 'DEC', idx })}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: 12, minWidth: 14, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => dispatchCart({ type: 'INC', idx })}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.black }}>{fmtPrice(p)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 20, background: C.subtleBg, borderTop: `1px solid ${C.ruleLight}`, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.inkSoft, marginBottom: 8 }}>
          <span>{t('subtotal', lang)}</span>
          <span>{market === 'AO' ? `${subtotal.toLocaleString('en-US')} Kz` : `€${subtotal.toFixed(2)}`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 16 }}>
          <span>{t('total', lang)}</span>
          <span>{market === 'AO' ? `${subtotal.toLocaleString('en-US')} Kz` : `€${subtotal.toFixed(2)}`}</span>
        </div>
        <button
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
          style={{ width: '100%', padding: 14, background: C.black, color: C.onDarkGold, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 8 }}
        >
          {t('checkout', lang)}
        </button>
      </div>
    </div>
  );
}
