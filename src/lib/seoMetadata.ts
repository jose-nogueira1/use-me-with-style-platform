import type { Lang } from '../theme';

export const SITE_TITLE = 'Use Me With Style';

export type SeoMetadata = {
  title: string;
  description: string;
};

const SITE_DESCRIPTION: Record<Lang, string> = {
  pt: 'Moda desportiva feminina para Angola e Portugal — leggings, conjuntos fitness e vestidos, com entrega em Luanda e em toda a Europa.',
  en: 'Activewear for women in Angola and Portugal — leggings, fitness sets and dresses, delivered in Luanda and across Europe.',
};

const ROUTE_METADATA: Record<string, Record<Lang, SeoMetadata>> = {
  '/': {
    pt: { title: `${SITE_TITLE} | Moda desportiva feminina`, description: SITE_DESCRIPTION.pt },
    en: { title: `${SITE_TITLE} | Women's activewear`, description: SITE_DESCRIPTION.en },
  },
  '/catalogo': {
    pt: { title: `Catálogo | ${SITE_TITLE}`, description: 'Explore leggings, conjuntos fitness, vestidos e acessórios Use Me With Style para Angola e Portugal.' },
    en: { title: `Catalogue | ${SITE_TITLE}`, description: 'Explore Use Me With Style leggings, fitness sets, dresses and accessories for Angola and Portugal.' },
  },
  '/carrinho': {
    pt: { title: `Carrinho | ${SITE_TITLE}`, description: 'Reveja as suas peças e prepare a sua encomenda Use Me With Style.' },
    en: { title: `Shopping bag | ${SITE_TITLE}`, description: 'Review your selected pieces and prepare your Use Me With Style order.' },
  },
  '/checkout': {
    pt: { title: `Finalizar compra | ${SITE_TITLE}`, description: 'Conclua a sua encomenda Use Me With Style com pagamento e entrega seguros.' },
    en: { title: `Checkout | ${SITE_TITLE}`, description: 'Complete your Use Me With Style order with secure payment and delivery.' },
  },
  '/conta': {
    pt: { title: `Acompanhar encomenda | ${SITE_TITLE}`, description: 'Consulte o estado e os detalhes da sua encomenda Use Me With Style.' },
    en: { title: `Track your order | ${SITE_TITLE}`, description: 'Check the status and details of your Use Me With Style order.' },
  },
  '/ajuda': {
    pt: { title: `Ajuda | ${SITE_TITLE}`, description: 'Encontre informações sobre entregas, pagamentos, tamanhos, trocas e devoluções.' },
    en: { title: `Help | ${SITE_TITLE}`, description: 'Find information about delivery, payments, sizing, exchanges and returns.' },
  },
  '/sobre': {
    pt: { title: `Sobre nós | ${SITE_TITLE}`, description: 'Conheça a Use Me With Style, uma marca de moda desportiva feminina para Angola e Portugal.' },
    en: { title: `About us | ${SITE_TITLE}`, description: 'Meet Use Me With Style, a women’s activewear brand for Angola and Portugal.' },
  },
  '/shop-instagram': {
    pt: { title: `Comprar no Instagram | ${SITE_TITLE}`, description: 'Descubra e compre os looks Use Me With Style partilhados no Instagram.' },
    en: { title: `Shop Instagram | ${SITE_TITLE}`, description: 'Discover and shop the Use Me With Style looks featured on Instagram.' },
  },
  '/politica-privacidade': {
    pt: { title: `Política de privacidade | ${SITE_TITLE}`, description: 'Saiba como a Use Me With Style recolhe, utiliza e protege os seus dados pessoais.' },
    en: { title: `Privacy policy | ${SITE_TITLE}`, description: 'Learn how Use Me With Style collects, uses and protects your personal data.' },
  },
  '/termos-condicoes': {
    pt: { title: `Termos e condições | ${SITE_TITLE}`, description: 'Consulte os termos e condições aplicáveis às compras na Use Me With Style.' },
    en: { title: `Terms and conditions | ${SITE_TITLE}`, description: 'Read the terms and conditions that apply to purchases from Use Me With Style.' },
  },
  '/eliminacao-de-dados': {
    pt: { title: `Eliminação de dados | ${SITE_TITLE}`, description: 'Consulte como pedir a eliminação dos seus dados pessoais na Use Me With Style.' },
    en: { title: `Data deletion | ${SITE_TITLE}`, description: 'Learn how to request deletion of your personal data from Use Me With Style.' },
  },
};

const DYNAMIC_METADATA: Array<{ matches: (pathname: string) => boolean; value: Record<Lang, SeoMetadata> }> = [
  {
    matches: (pathname) => pathname.startsWith('/produto/'),
    value: {
      pt: { title: `Produto | ${SITE_TITLE}`, description: SITE_DESCRIPTION.pt },
      en: { title: `Product | ${SITE_TITLE}`, description: SITE_DESCRIPTION.en },
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/encomenda-confirmada/'),
    value: ROUTE_METADATA['/conta'],
  },
  {
    matches: (pathname) => pathname.startsWith('/shop-instagram/'),
    value: ROUTE_METADATA['/shop-instagram'],
  },
];

const NOT_FOUND_METADATA: Record<Lang, SeoMetadata> = {
  pt: { title: `Página não encontrada | ${SITE_TITLE}`, description: 'A página que procura não existe ou mudou de endereço.' },
  en: { title: `Page not found | ${SITE_TITLE}`, description: 'The page you are looking for does not exist or has moved.' },
};

export function routeSeoMetadata(pathname: string, lang: Lang): SeoMetadata {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const exact = ROUTE_METADATA[normalizedPath];
  if (exact) return exact[lang];

  const dynamic = DYNAMIC_METADATA.find(({ matches }) => matches(normalizedPath));
  return dynamic?.value[lang] ?? NOT_FOUND_METADATA[lang];
}
