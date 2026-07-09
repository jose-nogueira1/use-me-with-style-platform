import { C, F } from '../../theme';

const PHASES = [
  {
    label: 'Fase 1 -- em curso',
    items: [
      'Loja (AO + PT): catálogo, produto, carrinho, checkout',
      'Captura de encomendas + estados (Nova → Revisão → Processamento → Enviada → Entregue)',
      'Pagamento: PayPal/Stripe/MBWay (PT), transferência bancária manual (AO)',
      'Admin: encomendas, produtos, clientes, definições de mercado',
      'Mensagens (WhatsApp + Instagram): automação por palavras-chave para dúvidas comuns, escalonamento humano para temas sensíveis',
    ],
  },
  {
    label: 'Fase 2 -- planeada',
    items: [
      'Contas de cliente completas',
      'Marketing / campanhas / calendário de conteúdo',
      'Mensagens com IA (agente completo, além das regras da Fase 1)',
      'Analytics e relatórios de desempenho',
    ],
  },
  {
    label: 'Fase 3 -- planeada',
    items: ['Meta Ads', 'Automação avançada', 'Inventário multi-armazém'],
  },
];

export function Roadmap() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 640 }}>
      <div style={{ fontFamily: F.display, fontSize: 28, color: C.ink, marginBottom: 20 }}>Roteiro</div>
      {PHASES.map((phase) => (
        <div key={phase.label} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.goldDeep, marginBottom: 8 }}>{phase.label}</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {phase.items.map((item) => (
              <li key={item} style={{ fontSize: 13, color: C.inkSoft, marginBottom: 4, lineHeight: 1.5 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
