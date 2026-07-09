// Prototype mock data. Kept as fallback/dev-mode content (VITE_ENABLE_MOCK_DATA)
// for working on the storefront/admin UI without the CMS backend running --
// NOT the source of truth once wired to the Payload API (see src/lib/api.ts).
// Tags and tones are aligned with the real Figma designs where product names
// match (Vestido Aurora, Vestido Lume, Top Athena, Top Iris, Conjunto Sereno).
import type { Product } from '../types/product';

export const PRODUCTS: Omit<Product, 'slug'>[] = [
  {
    id: "p1",
    name: "Vestido Aurora",
    cat: "vestidos",
    priceKz: 18500,
    priceEur: 22,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Areia", "Noite", "Coral"],
    stock: { S: 4, M: 8, L: 12 },
    tag: "New",
    tone: "gold",
  },
  {
    id: "p2",
    name: "Vestido Solene",
    cat: "vestidos",
    priceKz: 22000,
    priceEur: 26,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Preto", "Marfim"],
    stock: { S: 2, M: 6, L: 9 },
    tone: "rose",
  },
  {
    id: "p3",
    name: "Vestido Marés",
    cat: "vestidos",
    priceKz: 16500,
    priceEur: 20,
    sizes: ["S", "M", "L"],
    colors: ["Azul", "Areia"],
    stock: { S: 0, M: 4, L: 7 },
    tag: "Few left",
    tone: "sage",
  },
  {
    id: "p4",
    name: "Top Brisa",
    cat: "tops",
    priceKz: 8500,
    priceEur: 10,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Preto", "Branco", "Rosa"],
    stock: { S: 15, M: 12, L: 8 },
    tone: "dark",
  },
  {
    id: "p5",
    name: "Top Athena",
    cat: "tops",
    priceKz: 9500,
    priceEur: 11,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Preto", "Cinza"],
    stock: { S: 10, M: 14, L: 6 },
    tag: "New",
    tone: "dark",
  },
  {
    id: "p6",
    name: "Top Lyra",
    cat: "tops",
    priceKz: 7500,
    priceEur: 9,
    sizes: ["S", "M", "L"],
    colors: ["Branco", "Preto"],
    stock: { S: 5, M: 9, L: 11 },
    tone: "blue",
  },
  {
    id: "p7",
    name: "Leggings Tempo",
    cat: "leggings",
    priceKz: 12500,
    priceEur: 15,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Preto", "Caramelo"],
    stock: { S: 18, M: 22, L: 15 },
    tag: "In stock",
    tone: "blue",
  },
  {
    id: "p8",
    name: "Leggings Vento",
    cat: "leggings",
    priceKz: 14000,
    priceEur: 17,
    sizes: ["S", "M", "L"],
    colors: ["Preto", "Antracite"],
    stock: { S: 8, M: 12, L: 9 },
    tag: "New",
    tone: "gold",
  },
  {
    id: "p9",
    name: "Conjunto Sereno",
    cat: "conjuntos",
    priceKz: 24500,
    priceEur: 29,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Preto", "Marfim"],
    stock: { S: 6, M: 10, L: 4 },
    tag: "Bestseller",
    tone: "dark",
  },
  {
    id: "p10",
    name: "Conjunto Aurora",
    cat: "conjuntos",
    priceKz: 28000,
    priceEur: 33,
    sizes: ["S", "M", "L"],
    colors: ["Areia", "Carvão"],
    stock: { S: 3, M: 8, L: 5 },
    tag: "New",
    tone: "rose",
  },
  {
    id: "p11",
    name: "Top Iris",
    cat: "tops",
    priceKz: 8000,
    priceEur: 9.5,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Verde", "Preto"],
    stock: { S: 11, M: 7, L: 14 },
    tag: "In stock",
    tone: "sage",
  },
  {
    id: "p12",
    name: "Vestido Lume",
    cat: "vestidos",
    priceKz: 19500,
    priceEur: 23,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Coral", "Preto"],
    stock: { S: 7, M: 9, L: 11 },
    tag: "Few left",
    tone: "rose",
  },
];

export const ORDERS = [
  {
    id: "#1045",
    customer: "Mariana Sousa",
    total: 18500,
    status: "novo",
    items: 1,
    when: "há 12 min",
    market: "AO",
    city: "Luanda",
    items_detail: [
      {
        name: "Vestido Aurora",
        size: "M",
        color: "Areia",
        qty: 1,
        price: 18500,
      },
    ],
  },
  {
    id: "#1044",
    customer: "Ana Pereira",
    total: 24500,
    status: "novo",
    items: 2,
    when: "há 38 min",
    market: "PT",
    city: "Lisboa",
    items_detail: [
      { name: "Top Brisa", size: "S", color: "Preto", qty: 1, price: 8500 },
      {
        name: "Leggings Vento",
        size: "M",
        color: "Antracite",
        qty: 1,
        price: 14000,
      },
    ],
  },
  {
    id: "#1043",
    customer: "Beatriz Lima",
    total: 36000,
    status: "processando",
    items: 1,
    when: "há 2 h",
    market: "AO",
    city: "Luanda",
    items_detail: [
      {
        name: "Conjunto Aurora",
        size: "M",
        color: "Carvão",
        qty: 1,
        price: 28000,
      },
      { name: "Top Lyra", size: "M", color: "Branco", qty: 1, price: 7500 },
    ],
  },
  {
    id: "#1042",
    customer: "Sofia Mendes",
    total: 48000,
    status: "enviado",
    items: 3,
    when: "há 4 h",
    market: "PT",
    city: "Porto",
    items_detail: [
      {
        name: "Vestido Solene",
        size: "S",
        color: "Marfim",
        qty: 1,
        price: 22000,
      },
      {
        name: "Leggings Tempo",
        size: "S",
        color: "Preto",
        qty: 2,
        price: 12500,
      },
    ],
  },
  {
    id: "#1041",
    customer: "Carla Dias",
    total: 16500,
    status: "enviado",
    items: 1,
    when: "ontem",
    market: "AO",
    city: "Benguela",
    items_detail: [
      {
        name: "Vestido Marés",
        size: "L",
        color: "Areia",
        qty: 1,
        price: 16500,
      },
    ],
  },
  {
    id: "#1040",
    customer: "Inês Costa",
    total: 22000,
    status: "entregue",
    items: 1,
    when: "ontem",
    market: "PT",
    city: "Coimbra",
    items_detail: [
      {
        name: "Vestido Solene",
        size: "M",
        color: "Preto",
        qty: 1,
        price: 22000,
      },
    ],
  },
  {
    id: "#1039",
    customer: "Joana Silva",
    total: 31000,
    status: "entregue",
    items: 2,
    when: "2 dias",
    market: "AO",
    city: "Luanda",
    items_detail: [
      {
        name: "Leggings Tempo",
        size: "M",
        color: "Preto",
        qty: 1,
        price: 12500,
      },
      { name: "Top Athena", size: "M", color: "Preto", qty: 2, price: 9250 },
    ],
  },
  {
    id: "#1038",
    customer: "Rita Marques",
    total: 15000,
    status: "entregue",
    items: 1,
    when: "2 dias",
    market: "PT",
    city: "Lisboa",
    items_detail: [
      {
        name: "Leggings Vento",
        size: "L",
        color: "Preto",
        qty: 1,
        price: 14000,
      },
    ],
  },
];

export const MARKETING_DRAFTS = [
  {
    id: "m1",
    type: "instagram",
    typeLabel: { pt: "Legenda Instagram", en: "Instagram caption" },
    trigger: {
      pt: "Nova chegada · Vestido Aurora",
      en: "New arrival · Aurora Dress",
    },
    scheduledFor: { pt: "Hoje, 18:00", en: "Today, 6:00 PM" },
    content: {
      pt: "Apresentamos o nosso novo amor — o Vestido Aurora.\nCortado para movimento, feito para momentos.\n\nDisponível agora em três cores.\nToque para comprar —\n\n#UseMeWithStyle #Novidades",
      en: "Meet our newest love — the Aurora Dress.\nCut for movement, made for moments.\n\nAvailable now in three colours.\nTap to shop —\n\n#UseMeWithStyle #NewArrivals",
    },
  },
  {
    id: "m2",
    type: "tiktok",
    typeLabel: { pt: "Hook TikTok", en: "TikTok hook" },
    trigger: { pt: "Áudio em alta · GRWM", en: "Trending audio · GRWM" },
    scheduledFor: { pt: "Amanhã, 10:00", en: "Tomorrow, 10:00 AM" },
    content: {
      pt: '"3 formas de usar o Vestido Aurora"\n\n[Hook 0–3s]\nPOV: só tens um vestido\nmas ele acompanha-te a todo o lado.\n\nSom: áudio em alta (sugerido pela IA)\n#GRWM #ModaAngola #UseMeWithStyle',
      en: '"3 ways to style our Aurora Dress"\n\n[Hook 0–3s]\nPOV: you only own one dress\nbut it goes everywhere with you.\n\nSound: trending audio (auto-suggested)\n#GRWM #FashionAngola #UseMeWithStyle',
    },
  },
  {
    id: "m3",
    type: "email",
    typeLabel: { pt: "Email de recuperação", en: "Recovery email" },
    trigger: {
      pt: "Carrinho abandonado 1h · Mariana S.",
      en: "Cart abandoned 1h · Mariana S.",
    },
    scheduledFor: { pt: "Pronto a enviar", en: "Ready to send" },
    content: {
      pt: "Assunto: Deixou algo para trás\n\nOlá Mariana,\n\nO seu Vestido Aurora em M ainda está à espera.\nO stock está a esgotar — só restam 4.\n\nComplete a sua encomenda —",
      en: "Subject: You left something behind\n\nHi Mariana,\n\nYour Aurora Dress in M is still waiting.\nStock is moving fast — only 4 left.\n\nComplete your order —",
    },
  },
  {
    id: "m4",
    type: "whatsapp",
    typeLabel: { pt: "Mensagem WhatsApp", en: "WhatsApp broadcast" },
    trigger: {
      pt: "Reposição · 32 na lista de espera",
      en: "Back in stock · 32 on waitlist",
    },
    scheduledFor: { pt: "Pronto a enviar", en: "Ready to send" },
    content: {
      pt: "Olá — atualização rápida.\n\nO Vestido Marés em S voltou ao stock. Estava na lista de espera.\n\nReserve o seu: usemewithstyle.com\n(geralmente esgota em 48h)",
      en: "Hey — quick update.\n\nThe Marés Dress in S is back in stock. You were on the waitlist.\n\nReserve yours: usemewithstyle.com\n(usually sells out in 48h)",
    },
  },
  {
    id: "m5",
    type: "instagram",
    typeLabel: { pt: "Story Instagram", en: "Instagram story" },
    trigger: { pt: "Look do dia · Sábado", en: "Outfit of the day · Saturday" },
    scheduledFor: { pt: "Sábado, 11:00", en: "Saturday, 11:00 AM" },
    content: {
      pt: "OOTD ✨\n\nVestido Solene + saltos pretos\nPara um almoço de fim de semana sem complicações.\n\n→ Toque para ver o look completo",
      en: "OOTD ✨\n\nSolene Dress + black heels\nFor an effortless weekend lunch.\n\n→ Tap to see the full look",
    },
  },
];

export const ESCALATIONS = [
  {
    id: "e1",
    from: "Beatriz Lima",
    via: "WhatsApp",
    preview: {
      pt: "Boa tarde, o vestido que recebi tem um defeito na manga…",
      en: "Hi, the dress I received has a defect on the sleeve…",
    },
    when: "há 8 min",
    reason: "reclamacao",
  },
  {
    id: "e2",
    from: "Mariana Sousa",
    via: "Instagram DM",
    preview: {
      pt: "Olá! Posso pedir um vestido sob medida para um evento dia 30?",
      en: "Hi! Can I request a custom-sized dress for an event on the 30th?",
    },
    when: "há 22 min",
    reason: "sob-medida",
  },
  {
    id: "e3",
    from: "Sofia Mendes",
    via: "WhatsApp",
    preview: {
      pt: "Gostaria de devolver a encomenda #1042 — não me serviu",
      en: "I would like to return order #1042 — it did not fit me",
    },
    when: "há 45 min",
    reason: "devolucao",
  },
  {
    id: "e4",
    from: "Carla VIP",
    via: "WhatsApp",
    preview: {
      pt: "Quando chega a próxima coleção? Quero reservar antes do lançamento",
      en: "When does the next collection arrive? I want to reserve before launch",
    },
    when: "há 1 h",
    reason: "vip",
  },
];

export const ACCOUNT_ORDERS = ORDERS.slice(0, 4);
export const DEFAULT_WISHLIST = ["p1", "p5", "p9"];

export const INSTAGRAM_FEED = [
  { id: "ig1", productId: "p1", handle: "@usemewithstyle", likes: "1.2K", caption: { pt: "Vestido Aurora em movimento.", en: "Aurora Dress in motion." } },
  { id: "ig2", productId: "p9", handle: "@usemewithstyle", likes: "846", caption: { pt: "Conjunto Sereno para dias longos.", en: "Sereno Set for long days." } },
  { id: "ig3", productId: "p5", handle: "@usemewithstyle", likes: "672", caption: { pt: "Top Athena, sempre fácil.", en: "Athena Top, always easy." } },
  { id: "ig4", productId: "p8", handle: "@usemewithstyle", likes: "534", caption: { pt: "Leggings Vento no look de sábado.", en: "Vento Leggings for Saturday." } },
];

export const MARKETING_WEEK = [
  { day: "MON", channel: "IG", title: { pt: "Post de nova semana", en: "New week post" }, status: "ready" },
  { day: "TUE", channel: "IG · TIKTOK", title: { pt: "Dica de styling", en: "Style tip" }, status: "draft" },
  { day: "WED", channel: "IG", title: { pt: "Cliente em destaque", en: "Customer feature" }, status: "queued" },
  { day: "THU", channel: "WA · EMAIL", title: { pt: "Alerta de reposição", en: "Restock alert" }, status: "ready" },
  { day: "FRI", channel: "IG · FB", title: { pt: "Lookbook de fim de semana", en: "Weekend lookbook" }, status: "draft" },
  { day: "SAT", channel: "TT · STORY", title: { pt: "Look do dia", en: "Outfit of the day" }, status: "queued" },
  { day: "SUN", channel: "IG", title: { pt: "Reflexão / quote", en: "Reflection / quote" }, status: "draft" },
];

export const LIVE_FEED = [
  { name: "Mariana", action: { pt: "adicionou Vestido Aurora ao carrinho", en: "added Aurora Dress to cart" }, when: "agora", market: "AO" },
  { name: "Ana", action: { pt: "está a ver Conjunto Sereno", en: "is viewing Sereno Set" }, when: "1 min", market: "PT" },
  { name: "Carla VIP", action: { pt: "abriu o link privado da coleção", en: "opened the private collection link" }, when: "3 min", market: "AO" },
  { name: "Inês", action: { pt: "voltou ao checkout", en: "returned to checkout" }, when: "5 min", market: "PT" },
];

export const ANALYTICS_MARKETS = [
  { market: "Angola", revenue: "Kz 1.82M", share: 58, orders: 126 },
  { market: "Portugal", revenue: "€1.940", share: 31, orders: 74 },
  { market: "International", revenue: "€690", share: 11, orders: 18 },
];

export const CUSTOMERS = [
  { name: "Carla VIP", market: "AO", segment: "VIP", orders: 12, spent: "Kz 286K", waitlist: "Coleção SS26", lastSeen: "há 12 min" },
  { name: "Mariana Sousa", market: "AO", segment: "Waitlist", orders: 4, spent: "Kz 84K", waitlist: "Vestido Marés S", lastSeen: "há 22 min" },
  { name: "Ana Pereira", market: "PT", segment: "Repeat", orders: 6, spent: "€420", waitlist: "Top Athena", lastSeen: "hoje" },
  { name: "Sofia Mendes", market: "PT", segment: "Return risk", orders: 3, spent: "€188", waitlist: "—", lastSeen: "há 45 min" },
  { name: "Maya Johnson", market: "INTL", segment: "International", orders: 2, spent: "$164", waitlist: "Conjunto Aurora", lastSeen: "ontem" },
];

export const AI_HANDLED_MESSAGES = [
  { from: "Luísa", via: "WhatsApp", type: "Stock", text: { pt: "Confirmou stock do Vestido Aurora M e enviou link de compra.", en: "Confirmed Aurora Dress M stock and sent checkout link." }, when: "há 3 min" },
  { from: "Marta", via: "Instagram DM", type: "Sizing", text: { pt: "Recomendou tamanho S com base nas medidas.", en: "Recommended size S based on measurements." }, when: "há 9 min" },
  { from: "Nadia", via: "Facebook", type: "Tracking", text: { pt: "Partilhou tracking CTT da encomenda #1042.", en: "Shared CTT tracking for order #1042." }, when: "há 14 min" },
];

export const NOTIFICATIONS = [
  { title: { pt: "Vestido Marés S esgotado", en: "Marés Dress S sold out" }, sub: { pt: "32 pessoas na lista de espera", en: "32 customers on waitlist" } },
  { title: { pt: "Campanha Meta pronta", en: "Meta campaign ready" }, sub: { pt: "Aurora Drop aguarda aprovação", en: "Aurora Drop awaits approval" } },
  { title: { pt: "Pagamento por rever", en: "Payment needs review" }, sub: { pt: "Multicaixa · encomenda #1045", en: "Multicaixa · order #1045" } },
];

export const AUTOMATION_LOG = [
  { when: "09:12", action: { pt: "Recuperou carrinho abandonado de Mariana", en: "Recovered Mariana's abandoned cart" }, channel: "WhatsApp" },
  { when: "10:04", action: { pt: "Enviou alerta de stock para 32 clientes", en: "Sent restock alert to 32 customers" }, channel: "Email" },
  { when: "11:30", action: { pt: "Gerou anúncio Meta para Vestido Aurora", en: "Generated Meta ad for Aurora Dress" }, channel: "Meta" },
  { when: "12:18", action: { pt: "Respondeu pergunta de tamanho no Instagram", en: "Answered sizing question on Instagram" }, channel: "IG DM" },
];
