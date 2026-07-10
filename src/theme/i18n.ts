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
  city: { pt: 'Cidade', en: 'City' },
  country: { pt: 'País', en: 'Country' },
  notesOptional: { pt: 'Notas (opcional)', en: 'Notes (optional)' },
  delivery: { pt: 'Entrega', en: 'Delivery' },
  payment: { pt: 'Pagamento', en: 'Payment' },
  free: { pt: 'Grátis', en: 'Free' },
  payNow: { pt: 'Pagar agora', en: 'Pay now' },
  fillRequiredFields: { pt: 'Preencha todos os campos obrigatórios.', en: 'Please fill in all required fields.' },
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
  paymentMulticaixaExpress: { pt: 'Multicaixa Express', en: 'Multicaixa Express' },
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
};

export const t = (key: string, lang: Lang, vars?: Record<string, string | number>): string => {
  const raw = T[key] ? T[key][lang] : key;
  if (!vars) return raw;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), raw);
};
