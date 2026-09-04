import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { C, F, formatKz, t } from '../../theme';
import { useApp, useFormatPrice } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductPhoto } from '../../components/ProductPhoto';
import { imagesForColor } from '../../lib/productGallery';

type Props = {
  open: boolean;
  onClose: () => void;
  onViewCart: () => void;
};

export function MiniCartDrawer({ open, onClose, onViewCart }: Props) {
  const { market, lang, cart, dispatchCart } = useApp();
  const { products, loading } = useProducts(market, lang);
  const fmtPrice = useFormatPrice();
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.id);
    return product ? sum + (market === 'AO' ? product.effectivePriceKz : product.effectivePriceEur) * item.qty : sum;
  }, 0);
  const formattedSubtotal = market === 'AO'
    ? formatKz(subtotal)
    : new Intl.NumberFormat(lang === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(subtotal);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ump-mini-cart-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} className="ump-mini-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="mini-cart-title" tabIndex={-1}>
        <div className="ump-mini-cart-head">
          <div>
            <div id="mini-cart-title" style={{ fontFamily: F.display, fontSize: 23, fontWeight: 800, color: C.ink }}>
              {lang === 'pt' ? 'O seu carrinho' : 'Your cart'}
            </div>
            <div style={{ marginTop: 3, fontSize: 12, color: C.inkSoft }}>
              {lang === 'pt'
                ? `${cartCount} ${cartCount === 1 ? 'artigo' : 'artigos'}`
                : `${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            </div>
            {!confirmingClear ? (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                style={{ marginTop: 8, padding: 0, fontSize: 11, fontWeight: 700, color: C.inkSoft, textDecoration: 'underline', whiteSpace: 'nowrap' }}
              >
                {t('clearCart', lang)}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ fontSize: 10, color: C.inkSoft }}>{t('clearCartConfirmQuestion', lang)}</span>
                <button
                  type="button"
                  onClick={() => {
                    dispatchCart({ type: 'CLEAR' });
                    setConfirmingClear(false);
                  }}
                  style={{ padding: 0, fontSize: 10, fontWeight: 800, color: C.dangerStrong, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                >
                  {t('clearCartConfirmYes', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  style={{ padding: 0, fontSize: 10, fontWeight: 700, color: C.inkSoft, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                >
                  {t('clearCartConfirmCancel', lang)}
                </button>
              </div>
            )}
          </div>
          <button type="button" className="ump-mini-cart-close" onClick={onClose} aria-label={lang === 'pt' ? 'Fechar carrinho' : 'Close cart'}><X size={20} /></button>
        </div>

        <div className="ump-mini-cart-body">
          {cart.length === 0 ? (
            <div className="ump-mini-cart-empty">
              <span className="ump-mini-cart-empty-icon"><ShoppingBag size={26} /></span>
              <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink }}>{lang === 'pt' ? 'O carrinho está vazio' : 'Your cart is empty'}</div>
              <div style={{ fontSize: 12, color: C.inkSoft }}>{lang === 'pt' ? 'Descubra a coleção e escolha os seus favoritos.' : 'Explore the collection and choose your favourites.'}</div>
            </div>
          ) : cart.map((item, idx) => {
            const product = products.find((candidate) => candidate.id === item.id);
            if (!product) {
              return loading ? <div key={`${item.id}:${idx}`} className="ump-mini-cart-loading" aria-label={lang === 'pt' ? 'A carregar artigo' : 'Loading item'} /> : null;
            }
            const variant = product.variants.find((candidate) => item.variantId ? candidate.id === item.variantId : candidate.color === item.color && candidate.legacySize === item.size);
            const colorLabel = product.colors.find((candidate) => candidate.id === (variant?.color ?? item.color))?.name;
            const details = product.productType === 'bundle'
              ? (lang === 'pt' ? 'Kit de produtos' : 'Product kit')
              : [variant?.optionValue ?? variant?.legacySize ?? item.size, colorLabel].filter(Boolean).join(' · ');
            const image = imagesForColor(product.images, variant?.color ?? item.color)[0];
            const stock = variant?.stock ?? 0;
            return (
              <div className="ump-mini-cart-item" key={`${item.id}:${item.variantId ?? `${item.size}:${item.color}`}`}>
                <div className="ump-mini-cart-image"><ProductPhoto tone={product.tone} image={image} variant="thumbnail" radius={8} /></div>
                <div className="ump-mini-cart-item-info">
                  <div>
                    <div className="ump-mini-cart-item-top">
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{product.name}</div>
                      <button type="button" onClick={() => dispatchCart({ type: 'REMOVE', idx })} aria-label={`${lang === 'pt' ? 'Remover' : 'Remove'} ${product.name}`} style={{ color: C.inkSoft }}><X size={16} /></button>
                    </div>
                    {details ? <div style={{ marginTop: 5, fontSize: 11, color: C.inkSoft }}>{details}</div> : null}
                  </div>
                  <div className="ump-mini-cart-item-bottom">
                    <div className="ump-mini-cart-quantity">
                      <button type="button" onClick={() => dispatchCart({ type: 'DEC', idx })} aria-label={`${lang === 'pt' ? 'Diminuir quantidade de' : 'Decrease quantity of'} ${product.name}`} disabled={item.qty <= 1}><Minus size={12} /></button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => dispatchCart({ type: 'INC', idx, max: stock })} aria-label={`${lang === 'pt' ? 'Aumentar quantidade de' : 'Increase quantity of'} ${product.name}`} disabled={item.qty >= stock}><Plus size={12} /></button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.goldDeep }}>{fmtPrice(product)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ump-mini-cart-footer">
          {cart.length > 0 ? (
            <>
              <div className="ump-mini-cart-subtotal">
                <span>{lang === 'pt' ? 'Subtotal' : 'Subtotal'}</span>
                <strong>{formattedSubtotal}</strong>
              </div>
              <div className="ump-mini-cart-note">{lang === 'pt' ? 'Envio e descontos calculados no checkout.' : 'Shipping and discounts calculated at checkout.'}</div>
              <button type="button" className="ump-cart-added-primary" onClick={onViewCart}>{lang === 'pt' ? 'Ver carrinho e finalizar' : 'View cart and checkout'}</button>
            </>
          ) : null}
          <button type="button" className="ump-cart-added-secondary" onClick={onClose}>{lang === 'pt' ? 'Continuar a comprar' : 'Continue shopping'}</button>
        </div>
      </div>
    </div>
  );
}
