// Bilingual (PT/EN) dictionary for all storefront copy. PT-PT conventions
// (not Brazilian Portuguese) since the two Phase 1 markets are Angola and
// Portugal. Portuguese is the default language (see AppContext) -- English
// is one tap/click away via the header toggle. Product/brand names (Vestido
// Aurora, etc.) stay Portuguese regardless of the selected language, since
// they're proper names, not UI chrome.
export type Lang = 'pt' | 'en';

export const T: Record<string, Record<Lang, string>> = {
  // Nav
  shopAll: { pt: 'Ver tudo', en: 'Shop all' },
  newArrivalsNav: { pt: 'Novidades', en: 'New arrivals' },
  orderLookupNav: { pt: 'Consultar encomenda', en: 'Order lookup' },
  navShop: { pt: 'Loja', en: 'Shop' },
  navSearch: { pt: 'Pesquisar', en: 'Search' },
  navOrders: { pt: 'Encomendas', en: 'Orders' },
  navHelp: { pt: 'Ajuda', en: 'Help' },
  angola: { pt: 'Angola', en: 'Angola' },
  portugal: { pt: 'Portugal', en: 'Portugal' },
  market: { pt: 'Mercado', en: 'Market' },
  language: { pt: 'Idioma', en: 'Language' },
  shopAngolaStore: { pt: 'Comprar na loja Angola', en: 'Shop the Angola store' },
  shopPortugalStore: { pt: 'Comprar na loja Portugal', en: 'Shop the Portugal store' },

  // Categories
  dresses: { pt: 'Vestidos', en: 'Dresses' },
  tops: { pt: 'Tops', en: 'Tops' },
  leggings: { pt: 'Leggings', en: 'Leggings' },
  sets: { pt: 'Conjuntos', en: 'Sets' },
  all: { pt: 'Tudo', en: 'All' },

  // Home
  ss26Collection: { pt: 'Coleção SS26', en: 'SS26 Collection' },
  heroHeadline: { pt: 'Moda que se move consigo.', en: 'Fashion that moves with you.' },
  heroSubtitle: {
    pt: 'Peças pensadas para si, com preços sempre claros e diretos.',
    en: 'Considered pieces for you, with pricing always shown up front.',
  },
  categories: { pt: 'Categorias', en: 'Categories' },
  loadingProducts: { pt: 'A carregar produtos…', en: 'Loading products…' },
  newArrivals: { pt: 'Novidades', en: 'New arrivals' },
  viewAll: { pt: 'Ver todas', en: 'View all' },
  featured: { pt: 'Em destaque', en: 'Featured' },

  // Browse
  filters: { pt: 'Filtros', en: 'Filters' },
  category: { pt: 'Categoria', en: 'Category' },
  size: { pt: 'Tamanho', en: 'Size' },
  colour: { pt: 'Cor', en: 'Colour' },
  sort: { pt: 'Ordenar', en: 'Sort' },
  sortDefault: { pt: 'Padrão', en: 'Default' },
  sortPriceAsc: { pt: 'Preço ↑', en: 'Price ↑' },
  sortPriceDesc: { pt: 'Preço ↓', en: 'Price ↓' },
  searchProducts: { pt: 'Pesquisar produtos...', en: 'Search products...' },
  productSingular: { pt: 'produto', en: 'product' },
  productPlural: { pt: 'produtos', en: 'products' },
  noProductsFound: { pt: 'Nenhum produto encontrado.', en: 'No products found.' },

  // Product detail
  productNotFound: { pt: 'Produto não encontrado', en: 'Product not found' },
  continueShopping: { pt: 'Continuar a comprar', en: 'Continue shopping' },
  outOfStock: { pt: 'Esgotado', en: 'Out of stock' },
  fewLeftStock: { pt: 'Quase esgotado — {n} em stock', en: 'Few left — {n} in stock' },
  inStockCount: { pt: '{n}+ em stock', en: '{n}+ in stock' },
  sizeGuide: { pt: 'Guia de tamanhos', en: 'Size guide' },
  colourLabel: { pt: 'Cor', en: 'Colour' },
  description: { pt: 'Descrição', en: 'Description' },
  defaultDescription: {
    pt: 'Tecido fluido com toque suave. Um corte que valoriza qualquer silhueta.',
    en: 'Flowing fabric with a soft touch. A cut that flatters every silhouette.',
  },
  shipping: { pt: 'Envio', en: 'Shipping' },
  manualCoordination: { pt: 'Coordenação manual', en: 'Manual coordination' },
  businessDays: { pt: '1–2 dias úteis', en: '1–2 business days' },
  returns: { pt: 'Devoluções', en: 'Returns' },
  fourteenDays: { pt: '14 dias', en: '14 days' },
  // Angola's exchange window is 48h (exchange-only, no refunds) -- materially
  // different from Portugal/EU's 14-day statutory withdrawal, so this is a
  // separate key rather than reusing fourteenDays (JOS-64, 2026-07-23).
  fortyEightHours: { pt: '48 horas', en: '48 hours' },
  added: { pt: 'Adicionado', en: 'Added' },
  addToCart: { pt: 'Adicionar ao carrinho', en: 'Add to cart' },
  completeTheLook: { pt: 'Complete o look', en: 'Complete the look' },

  // Product tags
  tagNew: { pt: 'Novidade', en: 'New' },
  tagFewLeft: { pt: 'Quase esgotado', en: 'Few left' },
  tagBestseller: { pt: 'Mais vendido', en: 'Bestseller' },
  tagInStock: { pt: 'Em stock', en: 'In stock' },

  // Cart
  cart: { pt: 'Carrinho', en: 'Cart' },
  cartEmpty: { pt: 'O seu carrinho está vazio', en: 'Your cart is empty' },
  cartEmptyHint: { pt: 'Adicione peças para começar.', en: 'Add pieces to get started.' },
  itemSingular: { pt: 'peça', en: 'item' },
  itemPlural: { pt: 'peças', en: 'items' },
  subtotal: { pt: 'Subtotal', en: 'Subtotal' },
  total: { pt: 'Total', en: 'Total' },
  checkout: { pt: 'Finalizar compra', en: 'Checkout' },

  // Checkout
  contact: { pt: 'Contacto', en: 'Contact' },
  name: { pt: 'Nome', en: 'Name' },
  phoneWhatsapp: { pt: 'Telefone / WhatsApp', en: 'Phone / WhatsApp' },
  email: { pt: 'Email', en: 'Email' },
  address: { pt: 'Morada', en: 'Address' },
  addressLine2Optional: { pt: 'Andar / Porta (opcional)', en: 'Floor / Door (optional)' },
  postalCode: { pt: 'Código Postal', en: 'Postal Code' },
  city: { pt: 'Cidade', en: 'City' },
  country: { pt: 'País', en: 'Country' },
  countryLockedAO: {
    pt: 'Entregamos apenas dentro de Angola.',
    en: 'We currently only deliver within Angola.',
  },
  taxIdOptional: { pt: 'NIF (opcional)', en: 'Tax ID / NIF (optional)' },
  taxIdHint: { pt: 'Para efeitos de fatura.', en: 'For invoicing purposes.' },
  notesOptional: { pt: 'Notas (opcional)', en: 'Notes (optional)' },
  delivery: { pt: 'Entrega', en: 'Delivery' },
  payment: { pt: 'Pagamento', en: 'Payment' },
  free: { pt: 'Grátis', en: 'Free' },
  payNow: { pt: 'Pagar agora', en: 'Pay now' },
  fillRequiredFields: { pt: 'Preencha todos os campos obrigatórios.', en: 'Please fill in all required fields.' },
  invalidPostalCode: {
    pt: 'Código postal inválido. Use o formato 0000-000.',
    en: 'Invalid postal code. Use the format 0000-000.',
  },
  invalidTaxId: { pt: 'NIF inválido. Deve ter 9 dígitos.', en: 'Invalid NIF. It must have 9 digits.' },
  orderFailed: {
    pt: 'Não foi possível concluir a encomenda. A loja pode ainda não estar ligada ao servidor -- tente novamente em breve.',
    en: "Couldn't complete the order. The storefront may not be connected to the backend yet -- please try again shortly.",
  },
  deliveryCtt: { pt: 'CTT', en: 'CTT' },
  deliveryCourier: { pt: 'Estafeta', en: 'Courier' },
  deliveryCourierAo: { pt: 'Estafeta local', en: 'Local courier' },
  deliveryManual: { pt: 'Coordenação manual', en: 'Manual coordination' },
  paymentPaypal: { pt: 'PayPal', en: 'PayPal' },
  paymentStripe: { pt: 'Cartão (Stripe)', en: 'Card (Stripe)' },
  paymentMbway: { pt: 'MB WAY', en: 'MB WAY' },
  paymentMulticaixaExpress: { pt: 'AppyPay — Multicaixa Express ou Referência', en: 'AppyPay — Multicaixa Express or Reference' },
  paymentBankTransfer: { pt: 'Transferência bancária', en: 'Bank transfer' },
  localCourierDelivery: { pt: 'Entrega por estafeta local', en: 'Local courier delivery' },
  stripeRedirecting: { pt: 'A redirecionar para o pagamento seguro…', en: 'Redirecting to secure payment…' },
  stripeUnavailable: {
    pt: 'Pagamento por cartão indisponível de momento. Escolha outro método.',
    en: 'Card payment is unavailable right now. Please choose another method.',
  },
  paypalUnavailable: {
    pt: 'PayPal indisponível de momento. Escolha outro método.',
    en: 'PayPal is unavailable right now. Please choose another method.',
  },
  paymentCancelled: { pt: 'Pagamento cancelado. Pode tentar novamente.', en: 'Payment cancelled. You can try again.' },

  // Confirmation and lookup
  orderConfirmed: { pt: 'Encomenda confirmada', en: 'Order confirmed' },
  thankYou: { pt: 'Obrigada pela sua compra.', en: 'Thank you for your purchase.' },
  orderNumber: { pt: 'Número da encomenda', en: 'Order number' },
  confirmationSentNote: {
    pt: 'Enviámos os detalhes por email e WhatsApp. Pode consultar o estado da sua encomenda a qualquer momento abaixo.',
    en: "We've sent the details by email and WhatsApp. You can check your order's status any time below.",
  },
  orderStatus: { pt: 'Estado da encomenda', en: 'Order status' },
  statusReceived: { pt: 'Encomenda recebida', en: 'Order received' },
  statusProcessing: { pt: 'Em processamento', en: 'Processing' },
  statusShipped: { pt: 'Enviada', en: 'Shipped' },
  statusDelivered: { pt: 'Entregue', en: 'Delivered' },
  trackAnotherOrder: { pt: 'Consultar outra encomenda', en: 'Track another order' },
  lookupOrderStatus: { pt: 'Consulte o estado da sua encomenda.', en: 'Look up your order status.' },
  trackOrder: { pt: 'Consultar encomenda', en: 'Track order' },
  orderNotFound: {
    pt: 'Não encontrámos nenhuma encomenda com estes dados.',
    en: "We couldn't find an order matching those details.",
  },

  // Help
  needAHand: { pt: 'Precisa de ajuda?', en: 'Need a hand?' },
  helpBody: {
    pt: 'Escreva-nos no WhatsApp e responderemos em breve, ou consulte uma encomenda existente abaixo.',
    en: "Message us on WhatsApp and we'll get back to you shortly, or track an existing order below.",
  },
  chatOnWhatsapp: { pt: 'Conversar no WhatsApp', en: 'Chat on WhatsApp' },
  returnsPolicyHeading: { pt: 'Política de trocas e devoluções', en: 'Returns & exchanges policy' },
  returnsPolicyLoading: { pt: 'A carregar política…', en: 'Loading policy…' },
  returnsPolicyUnavailable: {
    pt: 'A política de trocas e devoluções está a ser atualizada. Contacte-nos no WhatsApp para qualquer pedido.',
    en: "Our returns & exchanges policy is being updated. Message us on WhatsApp for any request.",
  },
  businessHoursHeading: { pt: 'Horário de atendimento', en: 'Business hours' },
  shippingHeading: { pt: 'Entregas e envios', en: 'Shipping & delivery' },
  privacyPolicyNav: { pt: 'Política de Privacidade', en: 'Privacy Policy' },
  termsNav: { pt: 'Termos e Condições', en: 'Terms & Conditions' },
  legalPageLoading: { pt: 'A carregar…', en: 'Loading…' },
  legalPagePending: {
    pt: 'Este conteúdo está a ser preparado. Contacte-nos no WhatsApp para qualquer questão.',
    en: 'This content is being prepared. Message us on WhatsApp for any questions.',
  },
  complaintsBookLabel: { pt: 'Livro de Reclamações', en: 'Complaints Book' },
  emailUsHeading: { pt: 'Enviar-nos um email', en: 'Send us an email' },
  emailUsBody: {
    pt: 'Prefere email? Escreva-nos abaixo e respondemos assim que possível.',
    en: "Prefer email? Write to us below and we'll get back to you as soon as we can.",
  },
  contactNamePlaceholder: { pt: 'Nome', en: 'Name' },
  contactEmailPlaceholder: { pt: 'O seu email', en: 'Your email' },
  contactMessagePlaceholder: { pt: 'A sua mensagem', en: 'Your message' },
  sendMessage: { pt: 'Enviar mensagem', en: 'Send message' },
  contactMessageSent: {
    pt: 'Mensagem enviada! Responderemos assim que possível.',
    en: "Message sent! We'll get back to you as soon as we can.",
  },
  contactMessageFailed: {
    pt: 'Não foi possível enviar a mensagem agora. Tente novamente ou use o WhatsApp.',
    en: 'Could not send your message right now. Please try again or use WhatsApp.',
  },

  // Footer
  footerAbout: {
    pt: 'Moda pensada para Angola e Portugal — peças versáteis, entregues onde estiver.',
    en: 'Fashion designed for Angola and Portugal — versatile pieces, delivered wherever you are.',
  },
  footerShopHeading: { pt: 'Comprar', en: 'Shop' },
  footerSupportHeading: { pt: 'Apoio', en: 'Support' },
  footerInfoHeading: { pt: 'Informação', en: 'Information' },
  footerReturnsNote: { pt: 'Devoluções em {days}', en: 'Returns within {days}' },
  footerPricesNoteAo: { pt: 'Preços em Kz', en: 'Prices shown in Kz' },
  footerPricesNotePt: { pt: 'Preços em EUR', en: 'Prices shown in EUR' },
  prices: { pt: 'Preços', en: 'Prices' },
  copyrightNote: { pt: '© {year} Use Me With Style. Todos os direitos reservados.', en: '© {year} Use Me With Style. All rights reserved.' },
  aboutNav: { pt: 'Sobre nós', en: 'About us' },

  // Home: Instagram feed (static curated grid, no live API -- 2026-07-10
  // scope decision. Client account confirmed 2026-07-16).
  instagramHeading: { pt: 'Segue-nos', en: 'Follow us' },
  instagramHandle: { pt: '@use_me_withstyle', en: '@use_me_withstyle' },
  instagramSubheading: {
    pt: 'Partilhe o seu look com #UseMeWithStyle para aparecer aqui.',
    en: 'Share your look with #UseMeWithStyle to be featured here.',
  },
  instagramCta: { pt: 'Seguir no Instagram', en: 'Follow on Instagram' },

  // Real client-provided brand story (JOS-64 follow-up, added 2026-07-24) --
  // replaces the interim launch copy approved 2026-07-16. EN is our
  // translation of the client's PT text, not client-certified.
  aboutTitle: { pt: 'A nossa história', en: 'Our story' },
  aboutIntro: {
    pt: 'A USE ME WITH STYLE é uma marca de activewear, moda feminina e lifestyle, criada para mulheres que valorizam conforto, confiança, elegância e versatilidade.',
    en: 'USE ME WITH STYLE is an activewear, women’s fashion, and lifestyle brand created for women who value comfort, confidence, elegance, and versatility.',
  },
  aboutMissionTitle: { pt: 'Missão', en: 'Mission' },
  // Multi-paragraph (rendered split on blank lines, same pattern as the
  // Help page's CMS-driven sections) -- three paragraphs of the client's
  // brand story that follow the shorter hero intro above.
  aboutMissionBody: {
    pt: [
      'A marca disponibiliza peças pensadas para diferentes momentos da rotina feminina, desde o treino e o dia a dia até ocasiões que pedem um visual mais elegante. O nosso catálogo inclui conjuntos desportivos, peças casuais, vestidos e outros artigos selecionados para proporcionar conforto sem perder o estilo.',
      'Com atuação em Angola e Portugal e possibilidade de envios internacionais, a USE ME WITH STYLE procura aproximar mulheres de diferentes lugares através de coleções cuidadosamente selecionadas e disponibilizadas em quantidades limitadas.',
      'Mais do que roupa, a USE ME WITH STYLE representa uma forma de vestir com confiança, personalidade e liberdade.',
    ].join('\n\n'),
    en: [
      "The brand offers pieces designed for different moments in a woman's routine, from workouts and everyday life to occasions that call for a more elegant look. Our catalogue includes activewear sets, casual pieces, dresses, and other selected items designed to deliver comfort without compromising on style.",
      'With a presence in Angola and Portugal and international shipping available, USE ME WITH STYLE brings women from different places closer together through carefully curated collections released in limited quantities.',
      'More than just clothing, USE ME WITH STYLE represents a way of dressing with confidence, personality, and freedom.',
    ].join('\n\n'),
  },
  aboutValuesTitle: { pt: 'O que nos guia', en: 'What guides us' },
  aboutValue1Title: { pt: 'Qualidade em primeiro lugar', en: 'Quality first' },
  aboutValue1Body: {
    pt: 'Cada peça é escolhida para durar mais do que uma estação.',
    en: 'Every piece is chosen to outlast a single season.',
  },
  aboutValue2Title: { pt: 'Preços diretos', en: 'Honest pricing' },
  aboutValue2Body: {
    pt: 'Sem letras pequenas -- o preço que vê é o preço que paga.',
    en: "No fine print -- the price you see is the price you pay.",
  },
  aboutValue3Title: { pt: 'Perto de si', en: 'Close to you' },
  aboutValue3Body: {
    pt: 'Duas lojas, uma só marca: Angola e Portugal, cada uma com o seu atendimento.',
    en: 'Two storefronts, one brand: Angola and Portugal, each with its own local service.',
  },
  aboutCta: { pt: 'Ver a coleção', en: 'Shop the collection' },
};

export const t = (key: string, lang: Lang, vars?: Record<string, string | number>): string => {
  const raw = T[key] ? T[key][lang] : key;
  if (!vars) return raw;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), raw);
};

// Picks between a PT/EN pair of CMS-provided fields (as opposed to `t`
// above, which looks up static UI copy from the T dictionary). Prefers the
// storefront's selected language but falls back to whichever language is
// actually filled in -- e.g. if an EN field is still empty in the admin --
// rather than showing nothing. Shared by Help.tsx and the legal pages
// (originally duplicated in Help.tsx alone; extracted here 2026-07-24 once a
// third bilingual-CMS-text page needed the same logic).
export function pickBilingual(pt: string | undefined, en: string | undefined, lang: Lang): string | null {
  const ptTrimmed = pt?.trim();
  const enTrimmed = en?.trim();
  const preferred = lang === 'en' ? enTrimmed : ptTrimmed;
  return preferred || enTrimmed || ptTrimmed || null;
}
