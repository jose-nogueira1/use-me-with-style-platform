import { useEffect, useRef, type ReactNode } from 'react';
import { useApp } from '../state/AppContext';

const PT: Record<string, string> = {
  Dashboard: 'Painel', Orders: 'Encomendas', Products: 'Produtos', Settings: 'Definições', Customers: 'Clientes', Messages: 'Mensagens', More: 'Mais',
  'Log out': 'Terminar sessão', 'Phase 1 launch admin': 'Administração de lançamento — Fase 1',
  'Catalogue control': 'Gestão do catálogo', 'Add product': 'Adicionar produto', 'All': 'Todos', 'Active': 'Ativos', 'Draft': 'Rascunhos', 'Low stock': 'Stock reduzido', 'Photo pending': 'Fotografia em falta',
  'Manual product entry, stock by size, prices for both markets, and publish state.': 'Gestão manual de produtos, stock por tamanho, preços dos dois mercados e publicação.',
  'Product not found.': 'Produto não encontrado.', 'Loading…': 'A carregar…', 'Create catalogue item': 'Criar produto', 'Save changes': 'Guardar alterações', 'Publish product': 'Publicar produto',
  'Product name — Portuguese': 'Nome do produto — Português', 'Product name — English': 'Nome do produto — Inglês', Category: 'Categoria', Status: 'Estado', Published: 'Publicado',
  'Angola price (Kz)': 'Preço Angola (Kz)', 'Portugal price (EUR)': 'Preço Portugal (EUR)', 'Colours (comma separated)': 'Cores (separadas por vírgulas)', 'Merchandising tag': 'Etiqueta comercial',
  None: 'Nenhuma', 'Available in Angola': 'Disponível em Angola', 'Available in Portugal': 'Disponível em Portugal', 'Stock by size': 'Stock por tamanho', 'Add size': 'Adicionar tamanho',
  'Description — Portuguese': 'Descrição — Português', 'Description — English': 'Descrição — Inglês', 'Add photos': 'Adicionar fotografias', 'Client photo pending': 'Fotografia do cliente em falta',
  'Enter everything needed to sell a piece before final photography arrives.': 'Introduza toda a informação necessária para vender a peça antes da fotografia final chegar.',
  'Catalogue overview': 'Visão geral do catálogo', 'Recent orders': 'Encomendas recentes', 'View all': 'Ver todas', 'Total products': 'Total de produtos', 'Active products': 'Produtos ativos',
  'Low-stock products': 'Produtos com stock reduzido', Revenue: 'Receita', 'New orders': 'Novas encomendas', 'Payment review': 'Revisão de pagamento', Processing: 'Em processamento', Shipped: 'Enviado', Delivered: 'Entregue', Cancelled: 'Cancelado',
  'Order management': 'Gestão de encomendas', 'All orders': 'Todas as encomendas', 'Order number': 'Número da encomenda', Customer: 'Cliente', Market: 'Mercado', Total: 'Total', Date: 'Data', Actions: 'Ações', View: 'Ver',
  'Order details': 'Detalhes da encomenda', 'Customer details': 'Dados do cliente', 'Delivery address': 'Morada de entrega', Items: 'Artigos', Payment: 'Pagamento', 'Update status': 'Atualizar estado',
  Name: 'Nome', Phone: 'Telefone', Email: 'Email', Address: 'Morada', City: 'Cidade', Country: 'País', Quantity: 'Quantidade', Price: 'Preço', Size: 'Tamanho', Colour: 'Cor',
  'Customer directory': 'Diretório de clientes', 'Order count': 'Número de encomendas', 'Last order': 'Última encomenda',
  'Customer conversations': 'Conversas com clientes', 'Open conversations': 'Conversas abertas', 'Send reply': 'Enviar resposta', Reply: 'Responder', Resolved: 'Resolvido', Escalated: 'Encaminhado',
  'Store settings': 'Definições da loja', 'Save settings': 'Guardar definições', Angola: 'Angola', Portugal: 'Portugal', 'Payment methods': 'Métodos de pagamento', 'Delivery methods': 'Métodos de entrega', 'Returns policy': 'Política de devoluções',
  'Coming soon': 'Brevemente', 'This area is planned for a later phase.': 'Esta área está planeada para uma fase posterior.', Roadmap: 'Roteiro',
  Password: 'Palavra-passe', 'Log in': 'Iniciar sessão', Search: 'Pesquisar', Notifications: 'Notificações',
  "Couldn't connect to the backend.": 'Não foi possível ligar ao servidor.', "Couldn't save. Make sure the backend is running.": 'Não foi possível guardar. Confirme que o servidor está a funcionar.', "Couldn't upload the image.": 'Não foi possível carregar a imagem.',
  'Incorrect email or password, or the backend (use-me-with-style-cms) is not running yet.': 'Email ou palavra-passe incorretos, ou o servidor ainda não está a funcionar.',
  "Couldn't connect to the backend (use-me-with-style-cms). Make sure it's running on localhost:3000.": 'Não foi possível ligar ao servidor. Confirme que está a funcionar em localhost:3000.',
  "Couldn't load this order.": 'Não foi possível carregar esta encomenda.', "Couldn't load settings -- showing defaults.": 'Não foi possível carregar as definições — são apresentados os valores predefinidos.',
  "Couldn't send -- check the backend connection.": 'Não foi possível enviar — verifique a ligação ao servidor.',
  'Morning check': 'Verificação matinal', 'Angola and Portugal orders, payment review, low stock, and launch setup gaps.': 'Encomendas de Angola e Portugal, revisão de pagamentos, stock reduzido e tarefas de lançamento.', 'Export summary': 'Exportar resumo',
  'Orders today': 'Encomendas de hoje', 'Revenue today': 'Receita de hoje', 'Manual confirmation needed': 'Confirmação manual necessária', 'Orders being fulfilled': 'Encomendas em preparação', 'Sizes with 2 units or less': 'Tamanhos com 2 unidades ou menos',
  'Attention queue': 'Fila de atenção', 'Next best actions': 'Próximas ações recomendadas', 'Nothing needs attention right now.': 'Nada requer atenção neste momento.', 'Revenue trend': 'Evolução da receita', 'Last 7 days': 'Últimos 7 dias',
  'Market setup': 'Configuração dos mercados', 'Portugal payments': 'Pagamentos em Portugal', 'PayPal, Stripe, MBWay placeholders ready.': 'PayPal, Stripe e MB WAY preparados.', Ready: 'Pronto', 'Angola payments': 'Pagamentos em Angola', 'Appy Pay team response pending.': 'A aguardar resposta da equipa AppyPay.', Open: 'Aberto',
  'Messaging automation': 'Automação de mensagens', 'Keyword-based auto-replies for order/payment/delivery FAQs; sensitive topics always escalate to you.': 'Respostas automáticas por palavras-chave para encomendas, pagamentos e entregas; assuntos sensíveis são sempre encaminhados.',
  'Keep published for in-stock sizes and mark the rest unavailable.': 'Mantenha publicados os tamanhos com stock e marque os restantes como indisponíveis.',
  'Contact log': 'Registo de contactos', 'Lightweight contact and order history -- no full accounts yet (Phase 2).': 'Histórico simples de contactos e encomendas — contas completas ficam para a Fase 2.', 'No customers yet.': 'Ainda não existem clientes.',
  'Needs review': 'Requer revisão', 'Auto-handled': 'Tratado automaticamente', Neutral: 'Neutro', 'Settings / Messaging': 'Definições / Mensagens', 'AI-assisted messaging': 'Mensagens assistidas por IA',
  'Draft, review, approve, and send contextual replies for WhatsApp and Instagram.': 'Crie, reveja, aprove e envie respostas contextuais para WhatsApp e Instagram.', 'Approval queue': 'Fila de aprovação', Required: 'Obrigatório', 'No conversations.': 'Não existem conversas.', 'Select a conversation.': 'Selecione uma conversa.', Escalate: 'Encaminhar', 'Mark resolved': 'Marcar como resolvido', 'Write a reply…': 'Escreva uma resposta…', Send: 'Enviar',
  Back: 'Voltar', 'Manual payment confirmation before processing and manual Angola coordination.': 'Confirmação manual do pagamento antes do processamento e coordenação manual em Angola.', 'Confirm payment': 'Confirmar pagamento', 'Order summary': 'Resumo da encomenda', Current: 'Atual', Done: 'Concluído', Pending: 'Pendente',
  'Phone / WhatsApp': 'Telefone / WhatsApp', 'City / Country': 'Cidade / País', Notes: 'Notas', 'Items ordered': 'Artigos encomendados', Qty: 'Qtd.', 'Payment and delivery': 'Pagamento e entrega', Confirmed: 'Confirmado', 'Payment method': 'Método de pagamento', Review: 'Rever', 'Delivery method': 'Método de entrega', 'Order total': 'Total da encomenda', 'Approve and process': 'Aprovar e processar',
  'Order queue': 'Fila de encomendas', 'Capture customer details, confirm payment, coordinate delivery, and update status.': 'Registe os dados do cliente, confirme o pagamento, coordene a entrega e atualize o estado.', 'Sending…': 'A enviar…', 'WhatsApp update': 'Atualização por WhatsApp', 'No orders found.': 'Nenhuma encomenda encontrada.', 'Selected order': 'Encomenda selecionada', 'Open order detail': 'Abrir detalhes da encomenda',
  Dresses: 'Vestidos', Tops: 'Tops', Leggings: 'Leggings', Sets: 'Conjuntos', Slug: 'Slug', 'Soft launch copy until client approves final product descriptions. Include fit, care, fabric, and styling notes.': 'Texto provisório até à aprovação das descrições finais. Inclua corte, cuidados, tecido e sugestões de utilização.',
  'Launch configuration': 'Configuração de lançamento', 'Safe placeholders until payment, fulfilment, and client media inputs are final.': 'Valores provisórios seguros até finalizar pagamentos, operação e conteúdos do cliente.', 'Saved.': 'Guardado.', Currency: 'Moeda',
  'Kwanza, prices shown as Kz. Stripe/PayPal charges settle in EUR (neither gateway supports Kz).': 'Kwanza, com preços em Kz. Stripe e PayPal liquidam em EUR, pois não suportam Kz.',
  'AppyPay (Multicaixa Express) integration live': 'Integração AppyPay (Multicaixa Express/Referência) ativa', 'Multicaixa Express manual instructions (shown until AppyPay integration is live)': 'Instruções manuais apresentadas até a integração AppyPay estar ativa', Delivery: 'Entrega', 'Order flow': 'Fluxo da encomenda', 'New to Payment Review to Processing.': 'Nova → Revisão de pagamento → Em processamento.', Configured: 'Configurado', 'Euro, prices shown as EUR.': 'Euro, com preços em EUR.', 'New, Processing, Shipped, Delivered, Cancelled.': 'Nova, Em processamento, Enviada, Entregue, Cancelada.',
  Messaging: 'Mensagens', 'Phase 1': 'Fase 1', WhatsApp: 'WhatsApp', 'Keyword-based auto-replies (order status, payment, delivery FAQs); sensitive topics always escalate to you.': 'Respostas automáticas por palavras-chave; assuntos sensíveis são sempre encaminhados.', Instagram: 'Instagram', 'Same rule-based classification via Instagram DM; escalates to you when unmatched.': 'A mesma classificação por regras nas mensagens do Instagram; casos sem correspondência são encaminhados.', Deferred: 'Adiado', 'AI-drafted replies, campaign generation, Meta Ads, segmentation, and analytics.': 'Respostas por IA, campanhas, Meta Ads, segmentação e análises.',
  'Storefront language': 'Idioma da loja', 'Bilingual PT/EN (Portuguese default); admin stays English-only.': 'Loja e administração bilingues PT/EN, com Português por defeito.', 'Order Fields': 'Campos da encomenda', 'Name, phone/WhatsApp, email, notes.': 'Nome, telefone/WhatsApp, email e notas.', 'Address, city, country.': 'Morada, cidade e país.', Methods: 'Métodos', 'Payment method and delivery method.': 'Método de pagamento e método de entrega.', Lookup: 'Consulta', 'Confirmation and lookup without full accounts.': 'Confirmação e consulta sem contas completas.', 'Returns policy (internal note)': 'Política de devoluções (nota interna)', 'Still to be defined -- see the blueprint technical appendix (open decision).': 'Ainda por definir — consulte o apêndice técnico do plano.',
  'Deferred: AI campaigns, Meta Ads, advanced analytics, roles, full accounts, wishlist, loyalty, and VIP.': 'Adiado: campanhas de IA, Meta Ads, análises avançadas, funções, contas completas, favoritos, fidelização e VIP.',
  'Payment Review': 'Revisão de pagamento',
  Monday: 'Segunda-feira', Tuesday: 'Terça-feira', Wednesday: 'Quarta-feira', Thursday: 'Quinta-feira', Friday: 'Sexta-feira', Saturday: 'Sábado', Sunday: 'Domingo',
  Mon: 'Seg.', Tue: 'Ter.', Wed: 'Qua.', Thu: 'Qui.', Fri: 'Sex.', Sat: 'Sáb.', Sun: 'Dom.',
};

const EN: Record<string, string> = {
  'Em breve': 'Coming soon', 'Roteiro': 'Roadmap', 'Fase 1 -- em curso': 'Phase 1 — in progress', 'Fase 2 -- planeada': 'Phase 2 — planned', 'Fase 3 -- planeada': 'Phase 3 — planned',
  'Inventário avançado': 'Advanced inventory', 'Automação': 'Automation',
  'Esta secção está fora do âmbito da Fase 1 (loja + checkout + operações de encomendas/produtos/clientes). Está planeada para a Fase 2/3 -- ver o roteiro para detalhes.': 'This section is outside Phase 1 scope (store, checkout, and order/product/customer operations). It is planned for Phase 2/3 — see the roadmap for details.',
  'Esta secção está fora do âmbito da Fase 1 (loja + checkout + operações de encomendas/produtos/clientes).': 'This section is outside Phase 1 scope (store, checkout, and order/product/customer operations).',
  'Está planeada para a Fase 2/3 -- ver o roteiro para detalhes.': 'It is planned for Phase 2/3 — see the roadmap for details.',
  'Novidade': 'New', 'Quase esgotado': 'Almost sold out',
  'Loja (AO + PT): catálogo, produto, carrinho, checkout': 'Store (AO + PT): catalogue, product, cart, checkout',
  'Captura de encomendas + estados (Nova → Revisão → Processamento → Enviada → Entregue)': 'Order capture and statuses (New → Review → Processing → Shipped → Delivered)',
  'Pagamento: PayPal/Stripe/MBWay (PT), transferência bancária manual (AO)': 'Payments: PayPal/Stripe/MB WAY (PT), manual bank transfer (AO)',
  'Admin: encomendas, produtos, clientes, definições de mercado': 'Admin: orders, products, customers, market settings',
  'Mensagens (WhatsApp + Instagram): automação por palavras-chave para dúvidas comuns, escalonamento humano para temas sensíveis': 'Messaging (WhatsApp + Instagram): keyword automation for common questions and human escalation for sensitive topics',
  'Contas de cliente completas': 'Full customer accounts',
  'Marketing / campanhas / calendário de conteúdo': 'Marketing / campaigns / content calendar',
  'Mensagens com IA (agente completo, além das regras da Fase 1)': 'AI messaging (full agent, beyond Phase 1 rules)',
  'Analytics e relatórios de desempenho': 'Analytics and performance reporting',
  'Automação avançada': 'Advanced automation', 'Inventário multi-armazém': 'Multi-warehouse inventory',
};

const originals = new WeakMap<Node, string>();

function translate(value: string, lang: 'pt' | 'en'): string {
  const trimmed = value.trim();
  const dictionary = lang === 'pt' ? PT : EN;
  const direct = dictionary[trimmed];
  if (direct) return value.replace(trimmed, direct);
  if (lang === 'en') {
    return value
      .replace(/\bmulticaixa_express\b/g, 'AppyPay (Multicaixa Express / Reference)')
      .replace(/\bcourier_ao\b/g, 'Local courier')
      .replace(/\bcourier_pt\b/g, 'Courier')
      .replace(/\bpayment_review\b/g, 'Payment review');
  }
  const date = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/.test(trimmed) ? new Date(trimmed) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return value.replace(trimmed, new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date));
  }
  return value
    .replace(/^Products \/ /, 'Produtos / ')
    .replace(/^Orders \/ /, 'Encomendas / ')
    .replace(/^(All|Active|Draft|Low stock|Photo pending) (\d+)$/, (_, label, count) => `${PT[label] ?? label} ${count}`)
    .replace(/^(.+?) (\d+)$/, (match, label, count) => PT[label] ? `${PT[label]} ${count}` : match)
    .replace(/^(.+) has a size stockout$/, '$1 tem um tamanho esgotado')
    .replace(/^EUR (.+) separately$/, 'EUR $1 em separado')
    .replace(/\bmulticaixa_express\b/g, 'AppyPay (Multicaixa Express / Referência)')
    .replace(/\bcourier_ao\b/g, 'Estafeta local')
    .replace(/\bcourier_pt\b/g, 'Estafeta')
    .replace(/\bpayment_review\b/g, 'Revisão de pagamento');
}

export function AdminTranslationBoundary({ children }: { children: ReactNode }) {
  const { lang } = useApp();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const apply = () => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (!originals.has(node)) originals.set(node, node.textContent ?? '');
        const original = originals.get(node) ?? '';
        const next = translate(original, lang);
        if (node.textContent !== next) node.textContent = next;
      }
      element.querySelectorAll<HTMLElement>('[placeholder],[aria-label],[title]').forEach((item) => {
        for (const attribute of ['placeholder', 'aria-label', 'title']) {
          const value = item.getAttribute(attribute);
          if (!value) continue;
          const key = `data-admin-original-${attribute}`;
          if (!item.hasAttribute(key)) item.setAttribute(key, value);
          const original = item.getAttribute(key) ?? value;
          item.setAttribute(attribute, translate(original, lang));
        }
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(element, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);

  return <div ref={root}>{children}</div>;
}

export function AdminLanguageSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useApp();
  return <div aria-label={lang === 'pt' ? 'Idioma da administração' : 'Admin language'} style={{ display: 'flex', gap: 4 }}>
    {(['pt', 'en'] as const).map((option) => <button key={option} type="button" onClick={() => setLang(option)} aria-pressed={lang === option} style={{ padding: '5px 8px', borderRadius: 5, fontSize: 10, fontWeight: 800, border: `1px solid ${lang === option ? '#C8A96A' : dark ? '#3B332A' : '#D8D0C5'}`, background: lang === option ? '#C8A96A' : 'transparent', color: lang === option ? '#0B0A08' : dark ? '#D5CEC3' : '#3B352E' }}>{option.toUpperCase()}</button>)}
  </div>;
}
