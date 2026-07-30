import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';

export function NotFound() {
  const { lang } = useApp();
  const copy = lang === 'pt'
    ? {
        eyebrow: 'Erro 404',
        title: 'Esta página não existe.',
        body: 'O endereço pode estar incorreto ou a página pode ter mudado.',
        shop: 'Explorar a loja',
        home: 'Voltar ao início',
      }
    : {
        eyebrow: 'Error 404',
        title: 'This page does not exist.',
        body: 'The address may be incorrect or the page may have moved.',
        shop: 'Browse the shop',
        home: 'Back to home',
      };

  return (
    <main className="ump-form-width" style={{ padding: '72px 20px', textAlign: 'center' }}>
      <div style={{ color: C.goldDeep, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
        {copy.eyebrow}
      </div>
      <h1 style={{ margin: '12px 0 8px', color: C.ink, fontFamily: F.display, fontSize: 30 }}>
        {copy.title}
      </h1>
      <p style={{ margin: '0 auto 28px', color: C.inkSoft, lineHeight: 1.6 }}>{copy.body}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        <Link
          to="/catalogo"
          style={{ padding: '12px 18px', borderRadius: 8, background: C.ctaBg, border: `1px solid ${C.ctaBorder}`, color: C.onDarkGold, fontWeight: 800, textDecoration: 'none' }}
        >
          {copy.shop}
        </Link>
        <Link
          to="/"
          style={{ padding: '12px 18px', borderRadius: 8, border: `1px solid ${C.fieldBorder}`, color: C.ink, fontWeight: 700, textDecoration: 'none' }}
        >
          {copy.home}
        </Link>
      </div>
    </main>
  );
}
