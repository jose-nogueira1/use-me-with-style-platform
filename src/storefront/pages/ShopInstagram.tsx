import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ProductPhoto } from '../../components/ProductPhoto';
import { fetchInstagramFeed, type ApiInstagramPost } from '../../lib/api';
import { trackMetaCustomEvent } from '../../lib/metaAnalytics';
import { useApp } from '../../state/AppContext';
import { C, F } from '../../theme';
import { InstagramProductCard } from '../components/InstagramProductCard';
import { BreadcrumbJsonLd } from '../components/BreadcrumbJsonLd';

export function ShopInstagram() {
  const { lookSlug } = useParams<{ lookSlug?: string }>();
  const { lang, market } = useApp();
  const [posts, setPosts] = useState<ApiInstagramPost[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchInstagramFeed(12, market)
      .then((result) => {
        if (!cancelled) {
          setFailed(false);
          setPosts(result.posts.filter((post) => (post.products?.length ?? 0) > 0));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
          setFailed(true);
        }
      });
    return () => { cancelled = true; };
  }, [market]);

  const selected = useMemo(
    () => lookSlug ? posts?.find((post) => post.lookSlug.toLowerCase() === lookSlug.toLowerCase()) ?? null : null,
    [lookSlug, posts],
  );

  useEffect(() => {
    if (!selected) return;
    trackMetaCustomEvent('ShopTheLookOpen', {
      instagram_look_id: selected.id,
      product_ids: selected.products?.map((product) => product.id),
      market,
      surface: 'shop_instagram_page',
    });
  }, [market, selected]);

  return (
    <main style={{ minHeight: '70vh', background: C.paper }}>
      <BreadcrumbJsonLd items={[
        { name: lang === 'pt' ? 'Início' : 'Home', path: '/' },
        { name: lang === 'pt' ? 'Comprar no Instagram' : 'Shop Instagram', path: '/shop-instagram' },
        ...(selected ? [{ name: selected.captionDisplay || (lang === 'pt' ? 'Look do Instagram' : 'Instagram look'), path: `/shop-instagram/${encodeURIComponent(selected.lookSlug)}` }] : []),
      ]} />
      <section className="ump-content-width" style={{ padding: '44px 20px 56px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto 30px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: C.goldDeep, fontSize: 9, fontWeight: 850, letterSpacing: 2, textTransform: 'uppercase' }}>
            <ShoppingBag size={13} /> {lang === 'pt' ? 'Do Instagram para o seu armário' : 'From Instagram to your wardrobe'}
          </div>
          <h1 style={{ margin: '9px 0 8px', fontFamily: F.display, fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1, color: C.ink }}>
            {lang === 'pt' ? 'Comprar no Instagram' : 'Shop Instagram'}
          </h1>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: 13, lineHeight: 1.6 }}>
            {lang === 'pt'
              ? `Descubra as peças das nossas publicações com preços e disponibilidade atuais para ${market === 'AO' ? 'Angola' : 'Portugal'}.`
              : `Discover the pieces from our posts with current pricing and availability for ${market === 'AO' ? 'Angola' : 'Portugal'}.`}
          </p>
        </div>

        {posts === null ? (
          <div role="status" style={{ padding: 60, textAlign: 'center', color: C.inkSoft }}>…</div>
        ) : selected ? (
          <LookDetail post={selected} lang={lang} />
        ) : lookSlug ? (
          <EmptyState
            title={lang === 'pt' ? 'Este look já não está disponível.' : 'This look is no longer available.'}
            detail={lang === 'pt' ? 'Veja os looks mais recentes ou explore todo o catálogo.' : 'Browse the latest looks or explore the full catalogue.'}
            lang={lang}
          />
        ) : posts.length > 0 ? (
          <div className="ump-shop-instagram-grid">
            {posts.map((post, index) => <LookCard key={post.id} post={post} lang={lang} priority={index === 0} />)}
          </div>
        ) : (
          <EmptyState
            title={failed ? (lang === 'pt' ? 'Não foi possível carregar os looks.' : 'The looks could not be loaded.') : (lang === 'pt' ? 'Os primeiros looks chegam em breve.' : 'The first looks are coming soon.')}
            detail={lang === 'pt' ? 'Entretanto, todas as peças disponíveis estão no catálogo.' : 'In the meantime, every available piece is in the catalogue.'}
            lang={lang}
          />
        )}
      </section>
    </main>
  );
}

function LookCard({ post, lang, priority = false }: { post: ApiInstagramPost; lang: 'pt' | 'en'; priority?: boolean }) {
  return (
    <Link to={`/shop-instagram/${encodeURIComponent(post.lookSlug)}`} style={{ display: 'block', overflow: 'hidden', borderRadius: 12, border: `1px solid ${C.ruleLight}`, background: C.paper, color: C.ink, textDecoration: 'none' }}>
      <div style={{ aspectRatio: '4 / 5', overflow: 'hidden', position: 'relative' }}>
        <ProductPhoto tone="dark" radius={0} image={{ url: post.imageUrl, alt: post.captionDisplay }} priority={priority} />
        <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 999, background: 'rgba(5,5,5,0.78)', color: C.onDarkGold, fontSize: 9, fontWeight: 850 }}>
          <ShoppingBag size={11} /> {post.products?.length} {lang === 'pt' ? 'peças' : 'pieces'}
        </div>
      </div>
      <div style={{ padding: 13 }}>
        <div style={{ fontSize: 11, lineHeight: 1.45, color: C.inkSoft, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.captionDisplay}</div>
        <div style={{ marginTop: 8, color: C.goldDeep, fontSize: 10, fontWeight: 850 }}>{lang === 'pt' ? 'Comprar este look →' : 'Shop this look →'}</div>
      </div>
    </Link>
  );
}

function LookDetail({ post, lang }: { post: ApiInstagramPost; lang: 'pt' | 'en' }) {
  return (
    <div>
      <Link to="/shop-instagram" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, color: C.inkSoft, fontSize: 10, fontWeight: 800, textDecoration: 'none' }}>
        <ArrowLeft size={13} /> {lang === 'pt' ? 'Todos os looks' : 'All looks'}
      </Link>
      <div className="ump-shop-instagram-detail">
        <div style={{ borderRadius: 12, overflow: 'hidden', background: C.subtleBg }}>
          <div style={{ aspectRatio: '4 / 5' }}><ProductPhoto tone="dark" radius={0} image={{ url: post.imageUrl, alt: post.captionDisplay }} priority /></div>
          <div style={{ padding: 16 }}>
            <p style={{ margin: 0, color: C.inkSoft, fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{post.caption}</p>
            <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, color: C.goldDeep, fontSize: 10, fontWeight: 850, textDecoration: 'none' }}>
              <Camera size={12} /> {lang === 'pt' ? 'Ver no Instagram ↗' : 'View on Instagram ↗'}
            </a>
          </div>
        </div>
        <div>
          <h2 style={{ margin: '0 0 14px', fontFamily: F.display, fontSize: 26, color: C.ink }}>{lang === 'pt' ? 'Comprar este look' : 'Shop this look'}</h2>
          <div className="ump-shop-instagram-products">
            {post.products?.map((product) => <InstagramProductCard key={`${product.id}-${product.selectedColorId ?? 'any'}`} product={product} lookId={post.id} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, detail, lang }: { title: string; detail: string; lang: 'pt' | 'en' }) {
  return (
    <div style={{ maxWidth: 560, margin: '30px auto', padding: 32, border: `1px solid ${C.ruleLight}`, borderRadius: 12, textAlign: 'center', background: C.subtleBg }}>
      <ShoppingBag size={24} color={C.goldDeep} />
      <h2 style={{ margin: '12px 0 5px', fontFamily: F.display, fontSize: 22, color: C.ink }}>{title}</h2>
      <p style={{ margin: 0, color: C.inkSoft, fontSize: 12 }}>{detail}</p>
      <Link to="/catalogo" style={{ display: 'inline-flex', marginTop: 16, padding: '10px 16px', borderRadius: 7, background: C.black, color: C.onDarkGold, fontSize: 10, fontWeight: 850, textDecoration: 'none' }}>
        {lang === 'pt' ? 'Ver catálogo' : 'View catalogue'}
      </Link>
    </div>
  );
}
