import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { C, F, type Lang } from '../../theme';
import { ProductPhoto, type ProductTone } from '../../components/ProductPhoto';
import type { ProductImage } from '../../types/product';

type Props = {
  open: boolean;
  onClose: () => void;
  onViewCart: () => void;
  lang: Lang;
  productName: string;
  image?: ProductImage;
  tone: ProductTone;
  details: string;
  price: string;
  cartCount: number;
};

export function CartAddedDrawer({ open, onClose, onViewCart, lang, productName, image, tone, details, price, cartCount }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

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
    <div className="ump-cart-added-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} className="ump-cart-added-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-added-title" tabIndex={-1}>
        <div className="ump-cart-added-head">
          <div id="cart-added-title" style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, color: C.ink }}>
            <span className="ump-cart-added-check"><Check size={15} /></span>
            {lang === 'pt' ? 'Adicionado ao carrinho' : 'Added to cart'}
          </div>
          <button type="button" className="ump-cart-added-close" onClick={onClose} aria-label={lang === 'pt' ? 'Fechar' : 'Close'}><X size={20} /></button>
        </div>

        <div className="ump-cart-added-product">
          <div className="ump-cart-added-image"><ProductPhoto tone={tone} image={image} variant="thumbnail" /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.display, fontSize: 20, color: C.ink, lineHeight: 1.15 }}>{productName}</div>
            <div style={{ marginTop: 7, fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>{details}</div>
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, color: C.goldDeep }}>{price}</div>
          </div>
        </div>

        <div className="ump-cart-added-count">
          {lang === 'pt'
            ? `${cartCount} ${cartCount === 1 ? 'artigo' : 'artigos'} no carrinho`
            : `${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart`}
        </div>
        <button type="button" className="ump-cart-added-primary" onClick={onViewCart}>
          {lang === 'pt' ? 'Ver carrinho' : 'View cart'}
        </button>
        <button type="button" className="ump-cart-added-secondary" onClick={onClose}>
          {lang === 'pt' ? 'Continuar a comprar' : 'Continue shopping'}
        </button>
      </div>
    </div>
  );
}
