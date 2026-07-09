import { useLocation } from 'react-router-dom';
import { C, F } from '../../theme';

const TITLES: Record<string, string> = {
  '/admin/analytics': 'Analytics',
  '/admin/marketing': 'Marketing',
  '/admin/meta-ads': 'Meta Ads',
  '/admin/inventario': 'Inventário avançado',
  '/admin/automacao': 'Automação',
};

// Shared placeholder for every Phase 2/3-only admin section. These were
// fully wired to mock data in the original prototype, but per the locked
// Phase 1 scope (JOS-52) only the storefront + order/product/customer admin
// + WhatsApp order-notification foundation ship now. Rather than port
// screens that would look "live" but aren't backed by anything real, they
// collapse into this single honest placeholder.
export function ComingSoon() {
  const location = useLocation();
  const title = TITLES[location.pathname] ?? 'Em breve';

  return (
    <div style={{ padding: '32px 36px', maxWidth: 480 }}>
      <div style={{ fontFamily: F.display, fontSize: 28, color: C.ink, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>
        Esta secção está fora do âmbito da Fase 1 (loja + checkout + operações de encomendas/produtos/clientes).
        Está planeada para a Fase 2/3 -- ver o roteiro para detalhes.
      </div>
    </div>
  );
}
