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
};

const originals = new WeakMap<Node, string>();

function translate(value: string): string {
  const trimmed = value.trim();
  const direct = PT[trimmed];
  if (direct) return value.replace(trimmed, direct);
  return value
    .replace(/^Products \/ /, 'Produtos / ')
    .replace(/^Orders \/ /, 'Encomendas / ')
    .replace(/^(All|Active|Draft|Low stock|Photo pending) (\d+)$/, (_, label, count) => `${PT[label] ?? label} ${count}`);
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
        const next = lang === 'pt' ? translate(original) : original;
        if (node.textContent !== next) node.textContent = next;
      }
      element.querySelectorAll<HTMLElement>('[placeholder],[aria-label],[title]').forEach((item) => {
        for (const attribute of ['placeholder', 'aria-label', 'title']) {
          const value = item.getAttribute(attribute);
          if (!value) continue;
          const key = `data-admin-original-${attribute}`;
          if (!item.hasAttribute(key)) item.setAttribute(key, value);
          const original = item.getAttribute(key) ?? value;
          item.setAttribute(attribute, lang === 'pt' ? translate(original) : original);
        }
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(element, { childList: true, subtree: true });
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
