import React, { useState, useMemo, useReducer } from "react";
import {
  ShoppingBag,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Heart,
  Plus,
  Minus,
  Check,
  Star,
  Package,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Filter,
  X,
  Send,
  Edit3,
  SkipForward,
  Bell,
  ArrowUpRight,
  Eye,
  MoreVertical,
  Home,
  ShoppingCart,
  User,
  Layers,
  BarChart3,
  Settings,
  Globe,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const C = {
  noir: "#0A0A0A",
  ink: "#1A1A1A",
  inkSoft: "#4A4A4A",
  inkLight: "#8A8A8A",
  rule: "#E5E0D5",
  shell: "#EAE3D2",
  cream: "#FAF7F2",
  creamDeep: "#F2EBDC",
  white: "#FFFFFF",
  gold: "#CBA945",
  goldDeep: "#A8893A",
  goldLight: "#E8D08E",
  goldGhost: "#F5EBC9",
  success: "#5A8F4A",
  alert: "#C46B4A",
};

const F = {
  display: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — products, orders, marketing drafts, messages
// ═══════════════════════════════════════════════════════════════════════════

// Product silhouettes as inline SVGs (so they look intentional, not lazy)
const SilhouetteDress = ({ tone = C.goldLight }) => (
  <svg viewBox="0 0 100 140" style={{ width: "60%", height: "60%" }}>
    <path
      d="M 35 20 L 35 35 L 30 40 L 20 75 L 25 80 L 30 75 L 28 110 L 32 130 L 68 130 L 72 110 L 70 75 L 75 80 L 80 75 L 70 40 L 65 35 L 65 20 Z"
      fill={tone}
      opacity="0.7"
    />
    <circle cx="50" cy="14" r="6" fill={tone} opacity="0.7" />
    <path
      d="M 35 20 Q 50 25 65 20"
      stroke={tone}
      strokeWidth="2"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

const SilhouetteTop = ({ tone = C.goldLight }) => (
  <svg viewBox="0 0 100 140" style={{ width: "60%", height: "60%" }}>
    <path
      d="M 25 30 L 30 25 L 40 28 L 50 25 L 60 28 L 70 25 L 75 30 L 80 50 L 70 55 L 70 90 L 30 90 L 30 55 L 20 50 Z"
      fill={tone}
      opacity="0.7"
    />
  </svg>
);

const SilhouetteLegging = ({ tone = C.goldLight }) => (
  <svg viewBox="0 0 100 140" style={{ width: "60%", height: "60%" }}>
    <path
      d="M 35 20 L 65 20 L 68 60 L 60 130 L 52 130 L 50 70 L 48 130 L 40 130 L 32 60 Z"
      fill={tone}
      opacity="0.7"
    />
    <rect x="34" y="20" width="32" height="4" fill={tone} opacity="0.9" />
  </svg>
);

const SilhouetteSet = ({ tone = C.goldLight }) => (
  <svg viewBox="0 0 100 140" style={{ width: "60%", height: "60%" }}>
    <path
      d="M 30 25 L 40 22 L 50 25 L 60 22 L 70 25 L 72 55 L 60 60 L 58 75 L 42 75 L 40 60 L 28 55 Z"
      fill={tone}
      opacity="0.7"
    />
    <path
      d="M 40 80 L 60 80 L 62 100 L 55 130 L 50 130 L 48 130 L 42 130 L 38 100 Z"
      fill={tone}
      opacity="0.7"
    />
  </svg>
);

function ProductSilhouette({ cat, tone = C.goldLight }) {
  if (cat === "vestidos") return <SilhouetteDress tone={tone} />;
  if (cat === "tops") return <SilhouetteTop tone={tone} />;
  if (cat === "leggings") return <SilhouetteLegging tone={tone} />;
  return <SilhouetteSet tone={tone} />;
}

const PRODUCTS = [
  {
    id: "p1",
    name: "Vestido Aurora",
    cat: "vestidos",
    priceKz: 18500,
    priceEur: 22,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Areia", "Noite", "Coral"],
    stock: { S: 4, M: 8, L: 12 },
    tag: "NOVIDADE",
    tone: C.goldLight,
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
    tone: C.creamDeep,
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
    tag: "QUASE ESGOTADO",
    tone: C.shell,
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
    tone: C.goldGhost,
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
    tag: "BESTSELLER",
    tone: C.goldLight,
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
    tone: C.creamDeep,
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
    tone: C.shell,
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
    tag: "NOVIDADE",
    tone: C.goldGhost,
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
    tone: C.goldLight,
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
    tag: "NOVIDADE",
    tone: C.creamDeep,
  },
  {
    id: "p11",
    name: "Top Íris",
    cat: "tops",
    priceKz: 8000,
    priceEur: 9.5,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Verde", "Preto"],
    stock: { S: 11, M: 7, L: 14 },
    tone: C.shell,
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
    tone: C.goldGhost,
  },
];

const ORDERS = [
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

const MARKETING_DRAFTS = [
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

const ESCALATIONS = [
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

const ACCOUNT_ORDERS = ORDERS.slice(0, 4);
const DEFAULT_WISHLIST = ["p1", "p5", "p9"];

const INSTAGRAM_FEED = [
  { id: "ig1", productId: "p1", handle: "@usemewithstyle", likes: "1.2K", caption: { pt: "Vestido Aurora em movimento.", en: "Aurora Dress in motion." } },
  { id: "ig2", productId: "p9", handle: "@usemewithstyle", likes: "846", caption: { pt: "Conjunto Sereno para dias longos.", en: "Sereno Set for long days." } },
  { id: "ig3", productId: "p5", handle: "@usemewithstyle", likes: "672", caption: { pt: "Top Athena, sempre fácil.", en: "Athena Top, always easy." } },
  { id: "ig4", productId: "p8", handle: "@usemewithstyle", likes: "534", caption: { pt: "Leggings Vento no look de sábado.", en: "Vento Leggings for Saturday." } },
];

const MARKETING_WEEK = [
  { day: "MON", channel: "IG", title: { pt: "Post de nova semana", en: "New week post" }, status: "ready" },
  { day: "TUE", channel: "IG · TIKTOK", title: { pt: "Dica de styling", en: "Style tip" }, status: "draft" },
  { day: "WED", channel: "IG", title: { pt: "Cliente em destaque", en: "Customer feature" }, status: "queued" },
  { day: "THU", channel: "WA · EMAIL", title: { pt: "Alerta de reposição", en: "Restock alert" }, status: "ready" },
  { day: "FRI", channel: "IG · FB", title: { pt: "Lookbook de fim de semana", en: "Weekend lookbook" }, status: "draft" },
  { day: "SAT", channel: "TT · STORY", title: { pt: "Look do dia", en: "Outfit of the day" }, status: "queued" },
  { day: "SUN", channel: "IG", title: { pt: "Reflexão / quote", en: "Reflection / quote" }, status: "draft" },
];

const LIVE_FEED = [
  { name: "Mariana", action: { pt: "adicionou Vestido Aurora ao carrinho", en: "added Aurora Dress to cart" }, when: "agora", market: "AO" },
  { name: "Ana", action: { pt: "está a ver Conjunto Sereno", en: "is viewing Sereno Set" }, when: "1 min", market: "PT" },
  { name: "Carla VIP", action: { pt: "abriu o link privado da coleção", en: "opened the private collection link" }, when: "3 min", market: "AO" },
  { name: "Inês", action: { pt: "voltou ao checkout", en: "returned to checkout" }, when: "5 min", market: "PT" },
];

const ANALYTICS_MARKETS = [
  { market: "Angola", revenue: "Kz 1.82M", share: 58, orders: 126 },
  { market: "Portugal", revenue: "€1.940", share: 31, orders: 74 },
  { market: "International", revenue: "€690", share: 11, orders: 18 },
];

const CUSTOMERS = [
  { name: "Carla VIP", market: "AO", segment: "VIP", orders: 12, spent: "Kz 286K", waitlist: "Coleção SS26", lastSeen: "há 12 min" },
  { name: "Mariana Sousa", market: "AO", segment: "Waitlist", orders: 4, spent: "Kz 84K", waitlist: "Vestido Marés S", lastSeen: "há 22 min" },
  { name: "Ana Pereira", market: "PT", segment: "Repeat", orders: 6, spent: "€420", waitlist: "Top Athena", lastSeen: "hoje" },
  { name: "Sofia Mendes", market: "PT", segment: "Return risk", orders: 3, spent: "€188", waitlist: "—", lastSeen: "há 45 min" },
  { name: "Maya Johnson", market: "INTL", segment: "International", orders: 2, spent: "$164", waitlist: "Conjunto Aurora", lastSeen: "ontem" },
];

const AI_HANDLED_MESSAGES = [
  { from: "Luísa", via: "WhatsApp", type: "Stock", text: { pt: "Confirmou stock do Vestido Aurora M e enviou link de compra.", en: "Confirmed Aurora Dress M stock and sent checkout link." }, when: "há 3 min" },
  { from: "Marta", via: "Instagram DM", type: "Sizing", text: { pt: "Recomendou tamanho S com base nas medidas.", en: "Recommended size S based on measurements." }, when: "há 9 min" },
  { from: "Nadia", via: "Facebook", type: "Tracking", text: { pt: "Partilhou tracking CTT da encomenda #1042.", en: "Shared CTT tracking for order #1042." }, when: "há 14 min" },
];

const NOTIFICATIONS = [
  { title: { pt: "Vestido Marés S esgotado", en: "Marés Dress S sold out" }, sub: { pt: "32 pessoas na lista de espera", en: "32 customers on waitlist" } },
  { title: { pt: "Campanha Meta pronta", en: "Meta campaign ready" }, sub: { pt: "Aurora Drop aguarda aprovação", en: "Aurora Drop awaits approval" } },
  { title: { pt: "Pagamento por rever", en: "Payment needs review" }, sub: { pt: "Multicaixa · encomenda #1045", en: "Multicaixa · order #1045" } },
];

const AUTOMATION_LOG = [
  { when: "09:12", action: { pt: "Recuperou carrinho abandonado de Mariana", en: "Recovered Mariana's abandoned cart" }, channel: "WhatsApp" },
  { when: "10:04", action: { pt: "Enviou alerta de stock para 32 clientes", en: "Sent restock alert to 32 customers" }, channel: "Email" },
  { when: "11:30", action: { pt: "Gerou anúncio Meta para Vestido Aurora", en: "Generated Meta ad for Aurora Dress" }, channel: "Meta" },
  { when: "12:18", action: { pt: "Respondeu pergunta de tamanho no Instagram", en: "Answered sizing question on Instagram" }, channel: "IG DM" },
];

// ═══════════════════════════════════════════════════════════════════════════
// I18N — minimal dictionary
// ═══════════════════════════════════════════════════════════════════════════
const T = {
  // Storefront
  storefront: { pt: "Loja", en: "Storefront" },
  admin: { pt: "Administração", en: "Admin" },
  search: { pt: "Pesquisar", en: "Search" },
  cart: { pt: "Carrinho", en: "Cart" },
  back: { pt: "Voltar", en: "Back" },
  newArrivals: { pt: "Novidades", en: "New arrivals" },
  shopAll: { pt: "Ver tudo", en: "Shop all" },
  categories: { pt: "Categorias", en: "Categories" },
  dresses: { pt: "Vestidos", en: "Dresses" },
  tops: { pt: "Tops", en: "Tops" },
  leggings: { pt: "Leggings", en: "Leggings" },
  sets: { pt: "Conjuntos", en: "Sets" },
  size: { pt: "Tamanho", en: "Size" },
  color: { pt: "Cor", en: "Colour" },
  addToCart: { pt: "Adicionar ao carrinho", en: "Add to cart" },
  outOfStock: { pt: "Esgotado", en: "Out of stock" },
  inStock: { pt: "em stock", en: "in stock" },
  almostGone: { pt: "Quase esgotado", en: "Almost gone" },
  description: { pt: "Descrição", en: "Description" },
  shipping: { pt: "Envio", en: "Shipping" },
  returns: { pt: "Devoluções", en: "Returns" },
  cartEmpty: { pt: "O seu carrinho está vazio", en: "Your cart is empty" },
  continueShopping: { pt: "Continuar a comprar", en: "Continue shopping" },
  subtotal: { pt: "Subtotal", en: "Subtotal" },
  shippingCost: { pt: "Envio", en: "Shipping" },
  total: { pt: "Total", en: "Total" },
  checkout: { pt: "Finalizar compra", en: "Checkout" },
  contact: { pt: "Contacto", en: "Contact" },
  delivery: { pt: "Entrega", en: "Delivery" },
  payment: { pt: "Pagamento", en: "Payment" },
  email: { pt: "Email", en: "Email" },
  phone: { pt: "Telefone", en: "Phone" },
  address: { pt: "Morada", en: "Address" },
  city: { pt: "Cidade", en: "City" },
  payNow: { pt: "Pagar agora", en: "Pay now" },
  orderConfirmed: { pt: "Encomenda confirmada", en: "Order confirmed" },
  thankYou: {
    pt: "Obrigada pela sua compra",
    en: "Thank you for your purchase",
  },
  orderNumber: { pt: "Número da encomenda", en: "Order number" },
  trackOrder: { pt: "Acompanhar encomenda", en: "Track order" },
  filters: { pt: "Filtros", en: "Filters" },
  apply: { pt: "Aplicar", en: "Apply" },
  clear: { pt: "Limpar", en: "Clear" },
  free: { pt: "Grátis", en: "Free" },
  account: { pt: "Conta", en: "Account" },
  wishlist: { pt: "Wishlist", en: "Wishlist" },
  orderHistory: { pt: "Histórico", en: "History" },

  // Admin
  dashboard: { pt: "Painel", en: "Dashboard" },
  analytics: { pt: "Analytics", en: "Analytics" },
  orders: { pt: "Encomendas", en: "Orders" },
  products: { pt: "Produtos", en: "Products" },
  customers: { pt: "Clientes", en: "Customers" },
  homepage: { pt: "Homepage", en: "Homepage" },
  campaigns: { pt: "Campanhas", en: "Campaigns" },
  metaAds: { pt: "Meta Ads", en: "Meta Ads" },
  inventory: { pt: "Inventário", en: "Inventory" },
  automation: { pt: "Automação", en: "Automation" },
  team: { pt: "Equipa", en: "Team" },
  settings: { pt: "Definições", en: "Settings" },
  roadmap: { pt: "Roadmap", en: "Roadmap" },
  marketing: { pt: "Marketing", en: "Marketing" },
  messages: { pt: "Mensagens", en: "Messages" },
  todayRevenue: { pt: "Receita de hoje", en: "Today's revenue" },
  todayOrders: { pt: "Encomendas hoje", en: "Orders today" },
  weekTrend: { pt: "Tendência da semana", en: "Week trend" },
  topProducts: { pt: "Produtos em destaque", en: "Top products" },
  recentOrders: { pt: "Encomendas recentes", en: "Recent orders" },
  awaitingApproval: { pt: "A aguardar aprovação", en: "Awaiting approval" },
  approve: { pt: "Aprovar", en: "Approve" },
  edit: { pt: "Editar", en: "Edit" },
  skip: { pt: "Ignorar", en: "Skip" },
  reply: { pt: "Responder", en: "Reply" },
  morningCheck: { pt: "Bom dia, Raisa.", en: "Good morning, Raisa." },
  morningOverview: {
    pt: "Aqui está o resumo do seu negócio hoje.",
    en: "Here is your business overview today.",
  },
  versus: { pt: "vs ontem", en: "vs yesterday" },
  customer: { pt: "Cliente", en: "Customer" },
  status: { pt: "Estado", en: "Status" },
  novo: { pt: "Novo", en: "New" },
  processando: { pt: "A processar", en: "Processing" },
  enviado: { pt: "Enviado", en: "Shipped" },
  entregue: { pt: "Entregue", en: "Delivered" },
  via: { pt: "via", en: "via" },
  reclamacao: { pt: "Reclamação", en: "Complaint" },
  "sob-medida": { pt: "Sob medida", en: "Custom order" },
  devolucao: { pt: "Devolução", en: "Return" },
  vip: { pt: "VIP", en: "VIP" },
  scheduledFor: { pt: "Agendado para", en: "Scheduled for" },
  viewAll: { pt: "Ver todas", en: "View all" },
  growthMonth: { pt: "vs mês passado", en: "vs last month" },
  units: { pt: "unidades", en: "units" },
  manageStock: { pt: "Gerir stock", en: "Manage stock" },
  addProduct: { pt: "Adicionar produto", en: "Add product" },
  market: { pt: "Mercado", en: "Market" },
  brandedTagline: {
    pt: "Moda que se move consigo.",
    en: "Fashion that moves with you.",
  },
};

const t = (key, lang) => (T[key] ? T[key][lang] : key);

// ═══════════════════════════════════════════════════════════════════════════
// CART REDUCER
// ═══════════════════════════════════════════════════════════════════════════
function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find(
        (i) =>
          i.id === action.id &&
          i.size === action.size &&
          i.color === action.color,
      );
      if (existing) {
        return state.map((i) =>
          i === existing ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...state,
        { id: action.id, size: action.size, color: action.color, qty: 1 },
      ];
    }
    case "INC":
      return state.map((i, idx) =>
        idx === action.idx ? { ...i, qty: i.qty + 1 } : i,
      );
    case "DEC":
      return state
        .map((i, idx) =>
          idx === action.idx ? { ...i, qty: Math.max(1, i.qty - 1) } : i,
        )
        .filter((i) => i.qty > 0);
    case "REMOVE":
      return state.filter((_, idx) => idx !== action.idx);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [surface, setSurface] = useState("storefront");
  const [lang, setLang] = useState("pt");
  const [market, setMarket] = useState("AO");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1c1814",
        fontFamily: F.body,
        color: C.ink,
        padding: "24px 16px",
      }}
    >
      {/* Inject custom fonts via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; border: none; background: none; padding: 0; color: inherit; }
        input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.shell}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.gold}; }
        .ump-fade-in { animation: ump-fadeIn 0.4s ease-out; }
        @keyframes ump-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .ump-slide-up { animation: ump-slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes ump-slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ump-hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .ump-hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
      `}</style>

      <TopBar
        surface={surface}
        setSurface={setSurface}
        lang={lang}
        setLang={setLang}
        market={market}
        setMarket={setMarket}
      />

      <div style={{ marginTop: 16 }}>
        {surface === "storefront" ? (
          <StorefrontFrame lang={lang} market={market} />
        ) : (
          <AdminApp lang={lang} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOP BAR — surface switcher + language toggle + market toggle
// ═══════════════════════════════════════════════════════════════════════════
function TopBar({ surface, setSurface, lang, setLang, market, setMarket }) {
  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(8px)",
        borderRadius: 12,
        border: `1px solid rgba(203,169,69,0.15)`,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 22,
            color: C.cream,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
          }}
        >
          Use Me{" "}
          <span style={{ color: C.gold, fontStyle: "italic", fontWeight: 300 }}>
            with style
          </span>
        </div>
        <div
          style={{ width: 1, height: 18, background: "rgba(203,169,69,0.3)" }}
        />
        <div
          style={{
            fontSize: 10,
            color: C.goldLight,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Prototype · v1.0
        </div>
      </div>

      {/* Surface switcher */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: "rgba(0,0,0,0.3)",
          borderRadius: 8,
        }}
      >
        {["storefront", "admin"].map((s) => (
          <button
            key={s}
            onClick={() => setSurface(s)}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: surface === s ? C.noir : C.cream,
              background: surface === s ? C.gold : "transparent",
              borderRadius: 6,
              transition: "all 0.2s",
            }}
          >
            {t(s, lang)}
          </button>
        ))}
      </div>

      {/* Language + market toggles */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {surface === "storefront" && (
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: 3,
              background: "rgba(0,0,0,0.3)",
              borderRadius: 6,
            }}
          >
            {["AO", "PT", "INTL"].map((m) => (
              <button
                key={m}
                onClick={() => setMarket(m)}
                style={{
                  padding: "5px 10px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: market === m ? C.noir : C.cream,
                  background: market === m ? C.goldLight : "transparent",
                  borderRadius: 4,
                }}
              >
                {m === "AO" ? "AO Kz" : m === "PT" ? "PT €" : "INTL $"}
              </button>
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 2,
            padding: 3,
            background: "rgba(0,0,0,0.3)",
            borderRadius: 6,
          }}
        >
          {["pt", "en"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: "5px 10px",
                fontSize: 10,
                fontWeight: 600,
                color: lang === l ? C.noir : C.cream,
                background: lang === l ? C.goldLight : "transparent",
                borderRadius: 4,
                textTransform: "uppercase",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STOREFRONT — wrapped in a phone frame for the desktop demo
// ═══════════════════════════════════════════════════════════════════════════
function StorefrontFrame({ lang, market }) {
  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        paddingTop: 24,
        paddingBottom: 24,
      }}
    >
      {/* Phone shell */}
      <div
        style={{
          width: 390,
          height: 780,
          background: C.noir,
          borderRadius: 44,
          padding: 12,
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.4), 0 0 0 2px rgba(203,169,69,0.15)",
          position: "relative",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 28,
            background: C.noir,
            borderRadius: 14,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#2a2a2a",
            }}
          />
        </div>

        {/* Screen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: C.cream,
            borderRadius: 32,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Storefront lang={lang} market={market} />
        </div>
      </div>
    </div>
  );
}

function Storefront({ lang, market }) {
  const [screen, setScreen] = useState({ name: "home" });
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [favorites, setFavorites] = useState(new Set());

  const navigate = (name, params = {}) => setScreen({ name, ...params });
  const back = () => setScreen({ name: "home" });
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const fmtPrice = (kz) => {
    if (market === "AO") return `Kz ${kz.toLocaleString("pt-PT")}`;
    if (market === "INTL") {
      const usd = Math.ceil((PRODUCTS.find((p) => p.priceKz === kz)?.priceEur ?? kz / 850) * 1.1);
      return `$${usd}`;
    }
    const eur =
      PRODUCTS.find((p) => p.priceKz === kz)?.priceEur ?? Math.round(kz / 850);
    return `€${eur}`;
  };

  const toggleFav = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {/* Status bar (fake) */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 28px 6px",
          fontSize: 13,
          fontWeight: 600,
          color: C.ink,
        }}
      >
        <span>9:41</span>
        <span
          style={{
            display: "flex",
            gap: 5,
            alignItems: "center",
            fontSize: 11,
          }}
        >
          <span>●●●●</span>
          <span>5G</span>
          <span
            style={{
              display: "inline-block",
              width: 22,
              height: 11,
              border: `1px solid ${C.ink}`,
              borderRadius: 3,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 1,
                right: 6,
                background: C.ink,
                borderRadius: 1,
              }}
            />
          </span>
        </span>
      </div>

      {/* Header */}
      <StorefrontHeader
        screen={screen}
        cartCount={cartCount}
        onCart={() => navigate("cart")}
        onBack={back}
        onSearch={() => navigate("browse", { cat: "all", searchOpen: true })}
        onMenu={() => navigate("browse", { cat: "all" })}
      />

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div key={JSON.stringify(screen)} className="ump-fade-in">
          {screen.name === "home" && (
            <ScreenHome
              lang={lang}
              navigate={navigate}
              fmtPrice={fmtPrice}
            />
          )}
          {screen.name === "browse" && (
            <ScreenBrowse
              lang={lang}
              navigate={navigate}
              fmtPrice={fmtPrice}
              cat={screen.cat}
              searchOpen={screen.searchOpen}
            />
          )}
          {screen.name === "product" && (
            <ScreenProduct
              lang={lang}
              navigate={navigate}
              fmtPrice={fmtPrice}
              product={screen.product}
              dispatch={dispatch}
              favorites={favorites}
              toggleFav={toggleFav}
            />
          )}
          {screen.name === "cart" && (
            <ScreenCart
              lang={lang}
              navigate={navigate}
              fmtPrice={fmtPrice}
              cart={cart}
              dispatch={dispatch}
            />
          )}
          {screen.name === "checkout" && (
            <ScreenCheckout
              lang={lang}
              market={market}
              navigate={navigate}
              fmtPrice={fmtPrice}
              cart={cart}
              dispatch={dispatch}
            />
          )}
          {screen.name === "confirmation" && (
            <ScreenConfirmation
              lang={lang}
              navigate={navigate}
              orderId={screen.orderId}
            />
          )}
          {screen.name === "account" && (
            <ScreenAccount
              lang={lang}
              navigate={navigate}
              fmtPrice={fmtPrice}
              favorites={favorites}
            />
          )}
        </div>
      </div>

      {/* Bottom nav (only on core browsing/account screens) */}
      {(screen.name === "home" ||
        screen.name === "browse" ||
        screen.name === "account") && (
        <BottomNav
          screen={screen.name}
          navigate={navigate}
          cartCount={cartCount}
          lang={lang}
        />
      )}
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function StorefrontHeader({
  screen,
  cartCount,
  onCart,
  onBack,
  onSearch,
  onMenu,
}) {
  const showBack = screen.name !== "home";

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "8px 20px 12px",
        background: C.cream,
        borderBottom: `1px solid ${C.rule}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {showBack ? (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: C.ink,
          }}
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <button onClick={onMenu} style={{ color: C.ink }}>
          <Menu size={20} />
        </button>
      )}

      <div
        style={{
          fontFamily: F.display,
          fontSize: 22,
          color: C.ink,
          fontStyle: "italic",
          letterSpacing: "-0.02em",
        }}
      >
        Use Me
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {!showBack && (
          <button onClick={onSearch} style={{ color: C.ink }}>
            <Search size={18} />
          </button>
        )}
        <button onClick={onCart} style={{ position: "relative", color: C.ink }}>
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -6,
                background: C.gold,
                color: C.white,
                fontSize: 9,
                fontWeight: 700,
                borderRadius: 10,
                minWidth: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function BottomNav({ screen, navigate, cartCount, lang }) {
  const items = [
    {
      id: "home",
      icon: Home,
      label: { pt: "Início", en: "Home" },
      action: () => navigate("home"),
    },
    {
      id: "browse",
      icon: Layers,
      label: { pt: "Loja", en: "Shop" },
      action: () => navigate("browse", { cat: "all" }),
    },
    {
      id: "cart",
      icon: ShoppingBag,
      label: { pt: "Carrinho", en: "Cart" },
      action: () => navigate("cart"),
      badge: cartCount,
    },
    {
      id: "account",
      icon: User,
      label: { pt: "Conta", en: "Account" },
      action: () => navigate("account"),
    },
  ];
  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: `1px solid ${C.rule}`,
        background: C.white,
        display: "flex",
        padding: "8px 0 22px",
      }}
    >
      {items.map((it) => {
        const active =
          (it.id === "home" && screen === "home") ||
          (it.id === "browse" && screen === "browse");
        return (
          <button
            key={it.id}
            onClick={it.action}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              color: active ? C.goldDeep : C.inkLight,
              position: "relative",
            }}
          >
            <it.icon size={20} />
            <span
              style={{
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {it.label[lang]}
            </span>
            {it.badge > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: "32%",
                  background: C.gold,
                  color: C.white,
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: 10,
                  minWidth: 14,
                  height: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STOREFRONT SCREENS
// ═══════════════════════════════════════════════════════════════════════════
function ScreenHome({ lang, navigate, fmtPrice }) {
  const newArrivals = PRODUCTS.filter((p) => p.tag === "NOVIDADE").slice(0, 4);
  const featured = PRODUCTS.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          height: 380,
          background: `linear-gradient(135deg, ${C.shell} 0%, ${C.goldGhost} 60%, ${C.creamDeep} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative silhouette in hero */}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: 0,
            width: 240,
            height: 320,
            opacity: 0.55,
          }}
        >
          <SilhouetteDress tone={C.goldDeep} />
        </div>
        {/* Hero text */}
        <div style={{ position: "absolute", left: 24, top: 32, right: 140 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              color: C.goldDeep,
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {lang === "pt" ? "Coleção SS26" : "SS26 Collection"}
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 40,
              lineHeight: 1.05,
              color: C.ink,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            {lang === "pt"
              ? "Moda\nque se\nmove\nconsigo."
              : "Fashion\nthat moves\nwith you."}
          </div>
          <button
            onClick={() => navigate("browse", { cat: "all" })}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              background: C.ink,
              color: C.white,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 2,
            }}
          >
            {t("shopAll", lang)} →
          </button>
        </div>
      </div>

      {/* Categories scroll */}
      <div style={{ padding: "24px 0 8px" }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 4,
            color: C.goldDeep,
            fontWeight: 600,
            textTransform: "uppercase",
            padding: "0 20px",
            marginBottom: 12,
          }}
        >
          {t("categories", lang)}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "0 20px",
            overflowX: "auto",
          }}
        >
          {[
            {
              key: "vestidos",
              label: t("dresses", lang),
            },
            { key: "tops", label: t("tops", lang) },
            {
              key: "leggings",
              label: t("leggings", lang),
            },
            {
              key: "conjuntos",
              label: t("sets", lang),
            },
          ].map((c) => (
            <button
              key={c.key}
              onClick={() => navigate("browse", { cat: c.key })}
              className="ump-hover-lift"
              style={{
                flexShrink: 0,
                width: 90,
                background: C.white,
                borderRadius: 8,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: `1px solid ${C.rule}`,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: C.creamDeep,
                  borderRadius: 4,
                }}
              >
                <ProductSilhouette cat={c.key} tone={C.goldDeep} />
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.ink,
                  textAlign: "center",
                }}
              >
                {c.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* New arrivals strip */}
      <div style={{ padding: "20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "0 20px",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 4,
                color: C.goldDeep,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {t("newArrivals", lang)}
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontSize: 22,
                color: C.ink,
                marginTop: 4,
              }}
            >
              {lang === "pt" ? "Acabadas de chegar" : "Just arrived"}
            </div>
          </div>
          <button
            onClick={() => navigate("browse", { cat: "all" })}
            style={{
              fontSize: 10,
              color: C.goldDeep,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {t("viewAll", lang)} →
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "0 20px",
            overflowX: "auto",
          }}
        >
          {newArrivals.map((p) => (
            <ProductCardSmall
              key={p.id}
              product={p}
              onClick={() => navigate("product", { product: p })}
              fmtPrice={fmtPrice}
            />
          ))}
        </div>
      </div>

      {/* Editorial block */}
      <div
        style={{
          margin: "20px",
          background: C.ink,
          color: C.white,
          padding: "32px 24px",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 4,
            height: "100%",
            background: C.gold,
          }}
        />
        <div
          style={{
            fontSize: 9,
            letterSpacing: 4,
            color: C.gold,
            fontWeight: 600,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {lang === "pt" ? "Editorial" : "Editorial"}
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 26,
            lineHeight: 1.2,
            fontStyle: "italic",
          }}
        >
          {lang === "pt"
            ? '"Vestir-se bem é um ato de cuidado consigo mesma."'
            : '"Dressing well is an act of self-care."'}
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: C.goldLight }}>
          — Raisa Bandeira
        </div>
      </div>

      {/* Bestsellers grid */}
      <div style={{ padding: "0 20px 24px" }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 4,
            color: C.goldDeep,
            fontWeight: 600,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {lang === "pt" ? "Em destaque" : "Featured"}
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 22,
            color: C.ink,
            marginBottom: 16,
          }}
        >
          {lang === "pt" ? "Selecionadas para si" : "Picked for you"}
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {featured.map((p) => (
            <ProductCardGrid
              key={p.id}
              product={p}
              onClick={() => navigate("product", { product: p })}
              fmtPrice={fmtPrice}
            />
          ))}
        </div>
      </div>

      {/* Instagram feed */}
      <div style={{ padding: "4px 0 28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "0 20px",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 4,
                color: C.goldDeep,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Instagram
            </div>
            <div style={{ fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 4 }}>
              {lang === "pt" ? "Compre o feed" : "Shop the feed"}
            </div>
          </div>
          <div style={{ fontSize: 10, color: C.inkSoft, fontWeight: 600 }}>
            @usemewithstyle
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "0 20px", overflowX: "auto" }}>
          {INSTAGRAM_FEED.map((post) => {
            const p = PRODUCTS.find((product) => product.id === post.productId) || PRODUCTS[0];
            return (
              <button
                key={post.id}
                onClick={() => navigate("product", { product: p })}
                className="ump-hover-lift"
                style={{
                  flexShrink: 0,
                  width: 168,
                  background: C.white,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 8,
                  overflow: "hidden",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    height: 168,
                    background: `linear-gradient(145deg, ${p.tone}, ${C.creamDeep})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <ProductSilhouette cat={p.cat} tone={C.goldDeep} />
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      right: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: C.ink,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    <span>{post.handle}</span>
                    <Heart size={12} fill={C.gold} color={C.gold} />
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      right: 8,
                      bottom: 8,
                      padding: "4px 7px",
                      background: C.ink,
                      color: C.gold,
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {lang === "pt" ? "Comprar" : "Shop"}
                  </span>
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 11, color: C.ink, lineHeight: 1.35 }}>
                    {post.caption[lang]}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: C.inkLight }}>
                    <span>{post.likes} likes</span>
                    <span style={{ color: C.goldDeep, fontWeight: 700 }}>{p.name}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer tagline */}
      <div
        style={{
          padding: "24px 20px 32px",
          textAlign: "center",
          background: C.creamDeep,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontSize: 16,
            fontStyle: "italic",
            color: C.goldDeep,
          }}
        >
          {t("brandedTagline", lang)}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 9,
            letterSpacing: 3,
            color: C.inkLight,
            textTransform: "uppercase",
          }}
        >
          Angola · Portugal · International
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function ProductCardSmall({ product, onClick, fmtPrice }) {
  return (
    <button
      onClick={onClick}
      className="ump-hover-lift"
      style={{
        flexShrink: 0,
        width: 140,
        background: C.white,
        borderRadius: 8,
        overflow: "hidden",
        textAlign: "left",
        border: `1px solid ${C.rule}`,
      }}
    >
      <div
        style={{
          height: 160,
          background: product.tone,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <ProductSilhouette cat={product.cat} tone={C.goldDeep} />
        {product.tag && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: C.ink,
              color: C.gold,
              fontSize: 8,
              letterSpacing: 1,
              padding: "3px 6px",
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            {product.tag}
          </div>
        )}
      </div>
      <div style={{ padding: "10px 10px 12px" }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 14,
            color: C.ink,
            fontWeight: 500,
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.goldDeep,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {fmtPrice(product.priceKz)}
        </div>
      </div>
    </button>
  );
}

function ProductCardGrid({ product, onClick, fmtPrice }) {
  return (
    <button
      onClick={onClick}
      className="ump-hover-lift"
      style={{
        background: C.white,
        borderRadius: 8,
        overflow: "hidden",
        textAlign: "left",
        border: `1px solid ${C.rule}`,
      }}
    >
      <div
        style={{
          height: 180,
          background: product.tone,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <ProductSilhouette cat={product.cat} tone={C.goldDeep} />
        {product.tag && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: C.ink,
              color: C.gold,
              fontSize: 8,
              letterSpacing: 1,
              padding: "3px 6px",
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            {product.tag}
          </div>
        )}
      </div>
      <div style={{ padding: "10px 10px 12px" }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 14,
            color: C.ink,
            fontWeight: 500,
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.goldDeep,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {fmtPrice(product.priceKz)}
        </div>
      </div>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function ScreenBrowse({ lang, navigate, fmtPrice, cat, searchOpen }) {
  const [activeCat, setActiveCat] = useState(cat || "all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSize, setFilterSize] = useState(null);
  const [filterColor, setFilterColor] = useState(null);
  const [sortBy, setSortBy] = useState("default");

  const cats = [
    { key: "all", label: lang === "pt" ? "Tudo" : "All" },
    { key: "vestidos", label: t("dresses", lang) },
    { key: "tops", label: t("tops", lang) },
    { key: "leggings", label: t("leggings", lang) },
    { key: "conjuntos", label: t("sets", lang) },
  ];

  const filtered = useMemo(() => {
    let list = PRODUCTS;
    if (activeCat !== "all") list = list.filter((p) => p.cat === activeCat);
    if (searchTerm)
      list = list.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    if (filterSize) list = list.filter((p) => p.sizes.includes(filterSize));
    if (filterColor)
      list = list.filter((p) =>
        p.colors.some((c) => c.toLowerCase() === filterColor.toLowerCase()),
      );
    if (sortBy === "price-asc")
      list = [...list].sort((a, b) => a.priceKz - b.priceKz);
    if (sortBy === "price-desc")
      list = [...list].sort((a, b) => b.priceKz - a.priceKz);
    return list;
  }, [activeCat, searchTerm, filterSize, filterColor, sortBy]);

  const allSizes = ["XS", "S", "M", "L", "XL"];
  const allColors = [
    "Preto",
    "Branco",
    "Areia",
    "Marfim",
    "Coral",
    "Rosa",
    "Cinza",
  ];

  return (
    <div>
      {/* Search bar */}
      <div
        style={{
          padding: "12px 20px",
          background: C.cream,
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: C.white,
            borderRadius: 6,
            border: `1px solid ${C.rule}`,
          }}
        >
          <Search size={16} color={C.inkLight} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              lang === "pt" ? "Pesquisar produtos..." : "Search products..."
            }
            autoFocus={searchOpen}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              color: C.ink,
              background: "transparent",
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")}>
              <X size={14} color={C.inkLight} />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 20px",
          overflowX: "auto",
          background: C.cream,
        }}
      >
        {cats.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCat(c.key)}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: 0.5,
              borderRadius: 20,
              background: activeCat === c.key ? C.ink : C.white,
              color: activeCat === c.key ? C.gold : C.ink,
              border: `1px solid ${activeCat === c.key ? C.ink : C.rule}`,
              transition: "all 0.2s",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 20px",
          background: C.cream,
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <div style={{ fontSize: 11, color: C.inkSoft }}>
          {filtered.length}{" "}
          {filtered.length === 1
            ? lang === "pt"
              ? "produto"
              : "product"
            : lang === "pt"
              ? "produtos"
              : "products"}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            color: C.goldDeep,
            padding: "4px 8px",
            borderRadius: 4,
            background: showFilters ? C.goldGhost : "transparent",
          }}
        >
          <Filter size={12} />
          {t("filters", lang)}
          {(filterSize || filterColor || sortBy !== "default") && (
            <span
              style={{
                background: C.gold,
                color: C.white,
                fontSize: 8,
                width: 14,
                height: 14,
                borderRadius: 7,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              {
                [filterSize, filterColor, sortBy !== "default"].filter(Boolean)
                  .length
              }
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div
          className="ump-slide-up"
          style={{
            padding: "16px 20px",
            background: C.white,
            borderBottom: `1px solid ${C.rule}`,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                color: C.goldDeep,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {t("size", lang)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {allSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSize(filterSize === s ? null : s)}
                  style={{
                    minWidth: 36,
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: `1px solid ${filterSize === s ? C.gold : C.rule}`,
                    background: filterSize === s ? C.goldGhost : C.white,
                    color: filterSize === s ? C.goldDeep : C.ink,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                color: C.goldDeep,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {t("color", lang)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {allColors.map((co) => (
                <button
                  key={co}
                  onClick={() => setFilterColor(filterColor === co ? null : co)}
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    borderRadius: 4,
                    border: `1px solid ${filterColor === co ? C.gold : C.rule}`,
                    background: filterColor === co ? C.goldGhost : C.white,
                    color: filterColor === co ? C.goldDeep : C.ink,
                  }}
                >
                  {co}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                color: C.goldDeep,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {lang === "pt" ? "Ordenar" : "Sort"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "default", label: lang === "pt" ? "Padrão" : "Default" },
                {
                  key: "price-asc",
                  label: lang === "pt" ? "Preço ↑" : "Price ↑",
                },
                {
                  key: "price-desc",
                  label: lang === "pt" ? "Preço ↓" : "Price ↓",
                },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    borderRadius: 4,
                    border: `1px solid ${sortBy === s.key ? C.gold : C.rule}`,
                    background: sortBy === s.key ? C.goldGhost : C.white,
                    color: sortBy === s.key ? C.goldDeep : C.ink,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {(filterSize || filterColor || sortBy !== "default") && (
            <button
              onClick={() => {
                setFilterSize(null);
                setFilterColor(null);
                setSortBy("default");
              }}
              style={{
                marginTop: 14,
                fontSize: 11,
                color: C.inkSoft,
                textDecoration: "underline",
              }}
            >
              {t("clear", lang)}
            </button>
          )}
        </div>
      )}

      {/* Product grid */}
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          background: C.cream,
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              padding: "40px 20px",
              textAlign: "center",
              color: C.inkSoft,
              fontSize: 13,
            }}
          >
            {lang === "pt"
              ? "Nenhum produto encontrado."
              : "No products found."}
          </div>
        )}
        {filtered.map((p) => (
          <ProductCardGrid
            key={p.id}
            product={p}
            onClick={() => navigate("product", { product: p })}
            fmtPrice={fmtPrice}
          />
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function ScreenProduct({
  lang,
  navigate,
  fmtPrice,
  product,
  dispatch,
  favorites,
  toggleFav,
}) {
  const [size, setSize] = useState(
    product.sizes[Math.floor(product.sizes.length / 2)],
  );
  const [color, setColor] = useState(product.colors[0]);
  const [added, setAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const recommendations = PRODUCTS.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 2);

  const stockForSize = product.stock[size] ?? 10;
  const isLowStock = stockForSize > 0 && stockForSize <= 3;
  const isOutOfStock = stockForSize === 0;
  const isFav = favorites.has(product.id);

  const handleAdd = () => {
    if (isOutOfStock) return;
    dispatch({ type: "ADD", id: product.id, size, color });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div style={{ background: C.cream, position: "relative" }}>
      {/* Image */}
      <div
        style={{
          height: 440,
          background: product.tone,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <ProductSilhouette cat={product.cat} tone={C.goldDeep} />
        <button
          onClick={() => toggleFav(product.id)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 38,
            height: 38,
            background: "rgba(255,255,255,0.8)",
            borderRadius: 19,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <Heart
            size={18}
            fill={isFav ? C.gold : "none"}
            color={isFav ? C.gold : C.ink}
          />
        </button>
        {product.tag && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              background: C.ink,
              color: C.gold,
              fontSize: 9,
              letterSpacing: 2,
              padding: "5px 10px",
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            {product.tag}
          </div>
        )}
        {/* Image dots */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === 0 ? C.ink : "rgba(26,26,26,0.3)",
                transition: "width 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "20px 24px" }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 3,
            color: C.goldDeep,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {t(
            product.cat === "vestidos"
              ? "dresses"
              : product.cat === "tops"
                ? "tops"
                : product.cat === "leggings"
                  ? "leggings"
                  : "sets",
            lang,
          )}
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 28,
            color: C.ink,
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: C.goldDeep,
            marginTop: 8,
          }}
        >
          {fmtPrice(product.priceKz)}
        </div>

        {/* Stock indicator */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isOutOfStock ? (
            <span style={{ fontSize: 11, color: C.alert, fontWeight: 600 }}>
              ● {t("outOfStock", lang)}
            </span>
          ) : isLowStock ? (
            <span style={{ fontSize: 11, color: C.alert, fontWeight: 600 }}>
              ● {t("almostGone", lang)} — {stockForSize} {t("inStock", lang)}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: C.success, fontWeight: 500 }}>
              ● {stockForSize}+ {t("inStock", lang)}
            </span>
          )}
        </div>

        {/* Size */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1.5,
                color: C.goldDeep,
                textTransform: "uppercase",
              }}
            >
              {t("size", lang)}
            </div>
            <button
              onClick={() => setShowSizeGuide(true)}
              style={{
                fontSize: 10,
                color: C.inkSoft,
                textDecoration: "underline",
              }}
            >
              {lang === "pt" ? "Guia de tamanhos" : "Size guide"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {product.sizes.map((s) => {
              const outForThisSize = (product.stock[s] ?? 10) === 0;
              return (
                <button
                  key={s}
                  onClick={() => !outForThisSize && setSize(s)}
                  disabled={outForThisSize}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: `1px solid ${size === s ? C.ink : C.rule}`,
                    background: size === s ? C.ink : C.white,
                    color: outForThisSize
                      ? C.inkLight
                      : size === s
                        ? C.gold
                        : C.ink,
                    opacity: outForThisSize ? 0.4 : 1,
                    textDecoration: outForThisSize ? "line-through" : "none",
                    cursor: outForThisSize ? "not-allowed" : "pointer",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: C.goldDeep,
              textTransform: "uppercase",
            }}
          >
            {t("color", lang)}:{" "}
            <span style={{ color: C.ink, fontWeight: 500, marginLeft: 4 }}>
              {color}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {product.colors.map((co) => (
              <button
                key={co}
                onClick={() => setColor(co)}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  borderRadius: 20,
                  border: `1.5px solid ${color === co ? C.gold : C.rule}`,
                  background: color === co ? C.goldGhost : C.white,
                  color: color === co ? C.goldDeep : C.ink,
                  fontWeight: color === co ? 600 : 400,
                }}
              >
                {co}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            marginTop: 24,
            padding: "16px 0",
            borderTop: `1px solid ${C.rule}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: C.goldDeep,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t("description", lang)}
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>
            {lang === "pt"
              ? "Tecido fluido com toque suave. Caimento que valoriza qualquer silhueta. Para usar de dia ou à noite — confortável, elegante, sem esforço."
              : "Flowing fabric with a soft touch. A cut that flatters every silhouette. For day or night — comfortable, elegant, effortless."}
          </div>
        </div>

        {/* Shipping / Returns mini accordion */}
        <div
          style={{
            borderTop: `1px solid ${C.rule}`,
            padding: "12px 0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: C.ink }}>
            {t("shipping", lang)}
          </span>
          <span style={{ fontSize: 12, color: C.inkSoft }}>
            {lang === "pt" ? "1–2 dias úteis" : "1–2 business days"}
          </span>
        </div>
        <div
          style={{
            borderTop: `1px solid ${C.rule}`,
            padding: "12px 0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: C.ink }}>
            {t("returns", lang)}
          </span>
          <span style={{ fontSize: 12, color: C.inkSoft }}>
            {lang === "pt" ? "14 dias" : "14 days"}
          </span>
        </div>
      </div>

      {showSizeGuide && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.36)", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: C.white, borderRadius: 10, padding: 20, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.24)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: F.display, fontSize: 24 }}>{lang === "pt" ? "Guia de tamanhos" : "Size guide"}</div>
              <button onClick={() => setShowSizeGuide(false)}><X size={18} /></button>
            </div>
            {["XS · 78-84 cm", "S · 84-90 cm", "M · 90-96 cm", "L · 96-104 cm", "XL · 104-112 cm"].map((row) => (
              <div key={row} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: `1px solid ${C.rule}`, fontSize: 13 }}>
                <span>{row.split("·")[0]}</span><span style={{ color: C.inkSoft }}>{row.split("·")[1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky add to cart button */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: C.white,
          padding: "14px 20px",
          borderTop: `1px solid ${C.rule}`,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <button
          onClick={isOutOfStock ? () => setWaitlisted(true) : handleAdd}
          style={{
            width: "100%",
            padding: "14px",
            background: added ? C.success : isOutOfStock ? C.inkLight : C.ink,
            color: added ? C.white : isOutOfStock ? C.white : C.gold,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {added ? (
            <>
              <Check size={14} /> {lang === "pt" ? "Adicionado" : "Added"}
            </>
          ) : isOutOfStock ? (
            waitlisted ? (lang === "pt" ? "Na lista de espera" : "On waitlist") : (lang === "pt" ? "Avisar-me quando voltar" : "Notify me")
          ) : (
            <>
              {t("addToCart", lang)} · {fmtPrice(product.priceKz)}
            </>
          )}
        </button>
      </div>
      {recommendations.length > 0 && (
        <div style={{ padding: "18px 20px 24px", background: C.cream }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: C.goldDeep, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>{lang === "pt" ? "Complete o look" : "Complete the look"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {recommendations.map((p) => <ProductCardGrid key={p.id} product={p} onClick={() => navigate("product", { product: p })} fmtPrice={fmtPrice} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function ScreenCart({ lang, navigate, fmtPrice, cart, dispatch }) {
  if (cart.length === 0) {
    return (
      <div style={{ padding: "60px 30px", textAlign: "center" }}>
        <div
          style={{
            width: 60,
            height: 60,
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 30,
            background: C.creamDeep,
          }}
        >
          <ShoppingBag size={28} color={C.goldDeep} />
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 22,
            color: C.ink,
            marginBottom: 8,
          }}
        >
          {t("cartEmpty", lang)}
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.inkSoft,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {lang === "pt"
            ? "Adicione peças para começar."
            : "Add pieces to get started."}
        </div>
        <button
          onClick={() => navigate("home")}
          style={{
            padding: "12px 24px",
            background: C.ink,
            color: C.gold,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            borderRadius: 2,
          }}
        >
          {t("continueShopping", lang)}
        </button>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, i) => {
    const p = PRODUCTS.find((p) => p.id === i.id);
    return sum + (p ? p.priceKz * i.qty : 0);
  }, 0);

  return (
    <div style={{ background: C.cream }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <div style={{ fontFamily: F.display, fontSize: 26, color: C.ink }}>
          {t("cart", lang)}
        </div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
          {cart.length}{" "}
          {cart.length === 1
            ? lang === "pt"
              ? "peça"
              : "item"
            : lang === "pt"
              ? "peças"
              : "items"}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {cart.map((item, idx) => {
          const p = PRODUCTS.find((p) => p.id === item.id);
          if (!p) return null;
          return (
            <div
              key={idx}
              className="ump-slide-up"
              style={{
                display: "flex",
                gap: 12,
                padding: "14px 0",
                borderTop: `1px solid ${C.rule}`,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 100,
                  background: p.tone,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ProductSilhouette cat={p.cat} tone={C.goldDeep} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: F.display,
                    fontSize: 16,
                    color: C.ink,
                    fontWeight: 500,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                  {item.size} · {item.color}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: `1px solid ${C.rule}`,
                      borderRadius: 4,
                      padding: "2px",
                    }}
                  >
                    <button
                      onClick={() => dispatch({ type: "DEC", idx })}
                      style={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.ink,
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        minWidth: 16,
                        textAlign: "center",
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => dispatch({ type: "INC", idx })}
                      style={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.ink,
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: C.goldDeep }}
                  >
                    {fmtPrice(p.priceKz * item.qty)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: "REMOVE", idx })}
                style={{ color: C.inkLight, alignSelf: "flex-start" }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div
        style={{
          padding: "20px",
          marginTop: 12,
          background: C.white,
          borderTop: `1px solid ${C.rule}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 0",
            fontSize: 13,
            color: C.ink,
          }}
        >
          <span>{t("subtotal", lang)}</span>
          <span>{fmtPrice(subtotal)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 0",
            fontSize: 13,
            color: C.ink,
          }}
        >
          <span>{t("shippingCost", lang)}</span>
          <span style={{ color: C.success, fontWeight: 600 }}>
            {t("free", lang)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0 6px",
            marginTop: 6,
            borderTop: `1px solid ${C.rule}`,
            fontSize: 16,
            fontWeight: 600,
            color: C.ink,
          }}
        >
          <span>{t("total", lang)}</span>
          <span
            style={{ fontFamily: F.display, color: C.goldDeep, fontSize: 22 }}
          >
            {fmtPrice(subtotal)}
          </span>
        </div>
        <button
          onClick={() => navigate("checkout")}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "14px",
            background: C.ink,
            color: C.gold,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            borderRadius: 2,
          }}
        >
          {t("checkout", lang)} →
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function ScreenCheckout({ lang, market, navigate, fmtPrice, cart, dispatch }) {
  const [step, setStep] = useState("contact"); // contact → delivery → payment
  const [paymentMethod, setPaymentMethod] = useState(
    market === "AO" ? "multicaixa" : market === "INTL" ? "stripe" : "visa",
  );

  const subtotal = cart.reduce((sum, i) => {
    const p = PRODUCTS.find((p) => p.id === i.id);
    return sum + (p ? p.priceKz * i.qty : 0);
  }, 0);

  const steps = ["contact", "delivery", "payment"];
  const stepLabels = {
    contact: t("contact", lang),
    delivery: t("delivery", lang),
    payment: t("payment", lang),
  };

  const handlePay = () => {
    const orderId = "#" + (1046 + Math.floor(Math.random() * 100));
    dispatch({ type: "CLEAR" });
    navigate("confirmation", { orderId });
  };

  const paymentOptions =
    market === "AO"
      ? [
          {
            id: "multicaixa",
            label: "Multicaixa Express",
            sub: "Pagamento via app",
          },
          { id: "appypay", label: "Appy Pay", sub: "Pagamento móvel" },
        ]
      : market === "INTL"
        ? [
            { id: "stripe", label: "Stripe", sub: "Worldwide card payment" },
            { id: "paypal", label: "PayPal", sub: "Optional international checkout" },
          ]
      : [
          {
            id: "visa",
            label: "Visa / Mastercard",
            sub: lang === "pt" ? "Cartão de crédito" : "Credit card",
          },
          {
            id: "stripe",
            label: "Stripe Checkout",
            sub: lang === "pt" ? "Pagamento seguro" : "Secure payment",
          },
        ];

  return (
    <div style={{ background: C.cream, minHeight: "100%" }}>
      {/* Step indicator */}
      <div style={{ padding: "20px", borderBottom: `1px solid ${C.rule}` }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 26,
            color: C.ink,
            marginBottom: 14,
          }}
        >
          {t("checkout", lang)}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {steps.map((s, i) => {
            const isActive = step === s;
            const isPast = steps.indexOf(step) > i;
            return (
              <div
                key={s}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: isPast ? C.gold : isActive ? C.ink : C.shell,
                    color: isActive ? C.gold : C.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {isPast ? <Check size={14} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: isActive ? C.goldDeep : C.inkLight,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {stepLabels[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <div style={{ padding: "20px" }}>
        {step === "contact" && (
          <div className="ump-fade-in">
            <Field
              label={t("email", lang)}
              placeholder="raisa@exemplo.com"
              defaultValue="raisa.bandeira@example.com"
            />
            <Field
              label={t("phone", lang)}
              placeholder={
                market === "AO" ? "+244 9XX XXX XXX" : market === "INTL" ? "+1 XXX XXX XXXX" : "+351 9XX XXX XXX"
              }
              defaultValue={
                market === "AO" ? "+244 923 456 789" : market === "INTL" ? "+1 415 555 0198" : "+351 923 456 789"
              }
            />
          </div>
        )}
        {step === "delivery" && (
          <div className="ump-fade-in">
            <Field
              label={lang === "pt" ? "Nome completo" : "Full name"}
              defaultValue="Raisa Bandeira"
            />
            <Field
              label={t("address", lang)}
              defaultValue={
                market === "AO" ? "Rua do Cassequel, 123" : market === "INTL" ? "221 Market Street" : "Rua das Flores, 45"
              }
            />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2 }}>
                <Field
                  label={t("city", lang)}
                  defaultValue={market === "AO" ? "Luanda" : market === "INTL" ? "New York" : "Lisboa"}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Field
                  label={lang === "pt" ? "Código postal" : "Postcode"}
                  defaultValue={market === "AO" ? "1000" : market === "INTL" ? "10013" : "1100-053"}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: C.goldGhost,
                borderRadius: 4,
                fontSize: 11,
                color: C.goldDeep,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Package size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {market === "AO"
                  ? lang === "pt"
                    ? "Entrega prioritária em Luanda em 1–2 dias úteis. Tracking por SMS."
                    : "Priority delivery in Luanda in 1–2 business days. SMS tracking."
                  : market === "INTL"
                    ? "Worldwide tracked shipping in 5–10 business days. Duties calculated at checkout."
                  : lang === "pt"
                    ? "Entrega CTT em 2–3 dias úteis. Tracking incluído."
                    : "CTT delivery in 2–3 business days. Tracking included."}
              </span>
            </div>
          </div>
        )}
        {step === "payment" && (
          <div className="ump-fade-in">
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1.5,
                color: C.goldDeep,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {lang === "pt"
                ? "Escolha o método de pagamento"
                : "Choose payment method"}
            </div>
            {paymentOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "14px",
                  marginBottom: 8,
                  background: C.white,
                  border: `1.5px solid ${paymentMethod === opt.id ? C.gold : C.rule}`,
                  borderRadius: 6,
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    border: `2px solid ${paymentMethod === opt.id ? C.gold : C.rule}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  {paymentMethod === opt.id && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: C.gold,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                    {opt.sub}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Order summary */}
        <div
          style={{
            marginTop: 24,
            padding: 14,
            background: C.white,
            borderRadius: 6,
            border: `1px solid ${C.rule}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: C.ink,
              marginBottom: 6,
            }}
          >
            <span>{t("subtotal", lang)}</span>
            <span>{fmtPrice(subtotal)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: C.ink,
              marginBottom: 8,
            }}
          >
            <span>{t("shippingCost", lang)}</span>
            <span style={{ color: C.success, fontWeight: 600 }}>
              {t("free", lang)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTop: `1px solid ${C.rule}`,
              fontSize: 15,
              fontWeight: 600,
              color: C.ink,
            }}
          >
            <span>{t("total", lang)}</span>
            <span
              style={{ fontFamily: F.display, color: C.goldDeep, fontSize: 18 }}
            >
              {fmtPrice(subtotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: C.white,
          padding: "14px 20px",
          borderTop: `1px solid ${C.rule}`,
        }}
      >
        {step !== "payment" ? (
          <button
            onClick={() => setStep(steps[steps.indexOf(step) + 1])}
            style={{
              width: "100%",
              padding: "14px",
              background: C.ink,
              color: C.gold,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 2,
            }}
          >
            {lang === "pt" ? "Continuar" : "Continue"} →
          </button>
        ) : (
          <button
            onClick={handlePay}
            style={{
              width: "100%",
              padding: "14px",
              background: C.gold,
              color: C.ink,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 2,
            }}
          >
            {t("payNow", lang)} · {fmtPrice(subtotal)}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, defaultValue }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.5,
          color: C.goldDeep,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 14px",
          fontSize: 13,
          color: C.ink,
          background: C.white,
          border: `1px solid ${C.rule}`,
          borderRadius: 4,
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = C.gold)}
        onBlur={(e) => (e.target.style.borderColor = C.rule)}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function ScreenConfirmation({ lang, navigate, orderId }) {
  return (
    <div
      style={{
        background: C.cream,
        minHeight: "100%",
        padding: "40px 30px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          margin: "0 auto 24px",
          background: C.gold,
          borderRadius: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Check size={36} color={C.white} strokeWidth={3} />
      </div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: 4,
          color: C.goldDeep,
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {t("orderConfirmed", lang)}
      </div>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 30,
          color: C.ink,
          marginTop: 8,
          fontWeight: 500,
        }}
      >
        {t("thankYou", lang)}
      </div>
      <div
        style={{
          fontSize: 13,
          color: C.inkSoft,
          marginTop: 12,
          lineHeight: 1.6,
        }}
      >
        {lang === "pt"
          ? "Receberá uma confirmação por email e WhatsApp em breve."
          : "You will receive a confirmation by email and WhatsApp shortly."}
      </div>

      <div
        style={{
          margin: "32px 0",
          padding: "20px",
          background: C.white,
          borderRadius: 8,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: C.inkLight,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {t("orderNumber", lang)}
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 28,
            color: C.goldDeep,
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          {orderId}
        </div>
      </div>

      <button
        onClick={() => navigate("home")}
        style={{
          padding: "14px 28px",
          background: C.ink,
          color: C.gold,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          borderRadius: 2,
        }}
      >
        {t("continueShopping", lang)}
      </button>
    </div>
  );
}

function ScreenAccount({ lang, navigate, fmtPrice, favorites }) {
  const [tab, setTab] = useState("wishlist");
  const [returnId, setReturnId] = useState(null);
  const wishlistIds = favorites.size ? [...favorites] : DEFAULT_WISHLIST;
  const wishlist = wishlistIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div style={{ background: C.cream, minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ padding: "20px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              background: C.ink,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            RB
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 26, color: C.ink }}>
              Raisa
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft }}>
              raisa.bandeira@example.com
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 18,
            padding: 4,
            background: C.white,
            borderRadius: 8,
            border: `1px solid ${C.rule}`,
          }}
        >
          {[
            { id: "wishlist", label: t("wishlist", lang) },
            { id: "orders", label: t("orderHistory", lang) },
          ].map((it) => (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              style={{
                flex: 1,
                padding: "9px 10px",
                borderRadius: 5,
                background: tab === it.id ? C.ink : "transparent",
                color: tab === it.id ? C.gold : C.ink,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "wishlist" && (
        <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {wishlist.map((p) => (
            <ProductCardGrid
              key={p.id}
              product={p}
              onClick={() => navigate("product", { product: p })}
              fmtPrice={fmtPrice}
              lang={lang}
            />
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div style={{ padding: "0 20px" }}>
          {returnId && (
            <div style={{ padding: 14, background: C.goldGhost, border: `1px solid ${C.gold}`, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, color: C.ink }}>
                {lang === "pt" ? "Devolução iniciada" : "Return started"}
              </div>
              <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 4 }}>
                {lang === "pt" ? `A etiqueta para ${returnId} será enviada por email em 24h.` : `The label for ${returnId} will be emailed within 24h.`}
              </div>
            </div>
          )}
          {ACCOUNT_ORDERS.map((o) => (
            <div
              key={o.id}
              style={{
                width: "100%",
                padding: "14px 0",
                borderTop: `1px solid ${C.rule}`,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 17, color: C.ink }}>
                    {o.id}
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                    {o.items} {lang === "pt" ? "peças" : "items"} · {o.when}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: C.goldDeep, fontWeight: 700 }}>
                    {fmtPrice(o.total)}
                  </div>
                  <StatusBadge status={o.status} lang={lang} small />
                </div>
              </div>
              <button
                onClick={() => setReturnId(o.id)}
                style={{ marginTop: 10, fontSize: 10, color: C.goldDeep, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}
              >
                {lang === "pt" ? "Pedir devolução" : "Start return"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN APP — desktop layout
// ═══════════════════════════════════════════════════════════════════════════
function AdminApp({ lang }) {
  const [screen, setScreen] = useState("dashboard");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [marketingState, setMarketingState] = useState(() => {
    const m = {};
    MARKETING_DRAFTS.forEach((d) => {
      m[d.id] = "pending";
    });
    return m;
  });

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        background: C.cream,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        minHeight: 760,
        boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
      }}
    >
      <AdminSidebar
        screen={screen}
        setScreen={(s) => {
          setScreen(s);
          setSelectedOrder(null);
          setSelectedMessage(null);
        }}
        lang={lang}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <AdminTopBar lang={lang} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {screen === "dashboard" && (
            <AdminDashboard lang={lang} setScreen={setScreen} />
          )}
          {screen === "analytics" && <AdminAnalytics lang={lang} />}
          {screen === "orders" &&
            (selectedOrder ? (
              <AdminOrderDetail
                order={selectedOrder}
                lang={lang}
                onBack={() => setSelectedOrder(null)}
              />
            ) : (
              <AdminOrders lang={lang} onSelectOrder={setSelectedOrder} />
            ))}
          {screen === "products" && <AdminProducts lang={lang} />}
          {screen === "customers" && <AdminCustomers lang={lang} />}
          {screen === "homepage" && <AdminHomepage lang={lang} />}
          {screen === "campaigns" && <AdminCampaigns lang={lang} />}
          {screen === "metaAds" && <AdminMetaAds lang={lang} />}
          {screen === "inventory" && <AdminInventory lang={lang} />}
          {screen === "automation" && <AdminAutomation lang={lang} />}
          {screen === "team" && <AdminTeam lang={lang} />}
          {screen === "settings" && <AdminSettings lang={lang} />}
          {screen === "marketing" && (
            <AdminMarketing
              lang={lang}
              marketingState={marketingState}
              setMarketingState={setMarketingState}
            />
          )}
          {screen === "messages" &&
            (selectedMessage ? (
              <AdminMessageDetail
                message={selectedMessage}
                lang={lang}
                onBack={() => setSelectedMessage(null)}
              />
            ) : (
              <AdminMessages lang={lang} onSelectMessage={setSelectedMessage} />
            ))}
          {screen === "roadmap" && <AdminRoadmap lang={lang} />}
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ screen, setScreen, lang }) {
  const items = [
    { id: "dashboard", icon: BarChart3, label: t("dashboard", lang) },
    { id: "analytics", icon: TrendingUp, label: t("analytics", lang) },
    {
      id: "orders",
      icon: ShoppingCart,
      label: t("orders", lang),
      badge: ORDERS.filter((o) => o.status === "novo").length,
    },
    { id: "products", icon: Layers, label: t("products", lang) },
    { id: "customers", icon: User, label: t("customers", lang) },
    { id: "homepage", icon: Home, label: t("homepage", lang) },
    { id: "campaigns", icon: Star, label: t("campaigns", lang) },
    { id: "metaAds", icon: Globe, label: t("metaAds", lang) },
    { id: "inventory", icon: Package, label: t("inventory", lang) },
    { id: "automation", icon: Sparkles, label: t("automation", lang) },
    {
      id: "marketing",
      icon: Sparkles,
      label: t("marketing", lang),
      badge: MARKETING_DRAFTS.length,
    },
    {
      id: "messages",
      icon: MessageSquare,
      label: t("messages", lang),
      badge: ESCALATIONS.length,
    },
    { id: "team", icon: User, label: t("team", lang) },
    { id: "settings", icon: Settings, label: t("settings", lang) },
    { id: "roadmap", icon: BarChart3, label: t("roadmap", lang) },
  ];
  return (
    <div
      style={{
        width: 240,
        background: C.noir,
        color: C.cream,
        padding: "24px 12px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "0 8px 24px",
          borderBottom: `1px solid rgba(203,169,69,0.15)`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontSize: 20,
            color: C.cream,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
          }}
        >
          Use Me <span style={{ color: C.gold }}>with style</span>
        </div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 3,
            color: C.goldLight,
            textTransform: "uppercase",
            fontWeight: 600,
            marginTop: 6,
          }}
        >
          Admin
        </div>
      </div>

      {/* Nav */}
      {items.map((it) => {
        const active = screen === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setScreen(it.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 12px",
              marginBottom: 2,
              borderRadius: 6,
              background: active ? "rgba(203,169,69,0.12)" : "transparent",
              color: active ? C.gold : C.cream,
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              transition: "all 0.2s",
              borderLeft: active
                ? `2px solid ${C.gold}`
                : "2px solid transparent",
              textAlign: "left",
            }}
          >
            <it.icon size={16} />
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.badge > 0 && (
              <span
                style={{
                  background: C.gold,
                  color: C.noir,
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                }}
              >
                {it.badge}
              </span>
            )}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div
        style={{
          padding: "12px 8px",
          borderTop: `1px solid rgba(203,169,69,0.15)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: C.gold,
              color: C.noir,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            RB
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.cream, fontWeight: 500 }}>
              Raisa Bandeira
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.goldLight,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Owner
            </div>
          </div>
          <Settings size={14} color={C.goldLight} />
        </div>
      </div>
    </div>
  );
}

function AdminTopBar({ lang }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        padding: "14px 32px",
        background: C.white,
        borderBottom: `1px solid ${C.rule}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          maxWidth: 360,
        }}
      >
        <Search size={14} color={C.inkLight} />
        <input
          placeholder={
            lang === "pt"
              ? "Pesquisar encomendas, produtos, clientes..."
              : "Search orders, products, customers..."
          }
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 13,
            color: C.ink,
            background: "transparent",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: C.inkSoft,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {new Date().toLocaleDateString(lang === "pt" ? "pt-PT" : "en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <button onClick={() => setOpen(!open)} style={{ position: "relative", color: C.ink }}>
          <Bell size={16} />
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: 4,
              background: C.gold,
            }}
          />
        </button>
        {open && (
          <div style={{ position: "absolute", top: 66, right: 34, width: 320, background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, boxShadow: "0 18px 48px rgba(0,0,0,0.16)", zIndex: 50, overflow: "hidden" }}>
            <div style={{ padding: 14, fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800 }}>{lang === "pt" ? "Notificações" : "Notifications"}</div>
            {NOTIFICATIONS.map((n) => (
              <div key={n.title.en} style={{ padding: "13px 14px", borderTop: `1px solid ${C.rule}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{n.title[lang]}</div>
                <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3 }}>{n.sub[lang]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function AdminDashboard({ lang, setScreen }) {
  return (
    <div style={{ padding: 32 }}>
      {/* Greeting */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontSize: 32,
            color: C.ink,
            fontWeight: 500,
          }}
        >
          {t("morningCheck", lang)}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
          {t("morningOverview", lang)}
        </div>
      </div>

      <LiveFeedWidget lang={lang} />

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <KpiCard
          label={t("todayOrders", lang)}
          value="12"
          change="+3"
          sub={t("versus", lang)}
          positive
        />
        <KpiCard
          label={t("todayRevenue", lang)}
          value="Kz 218K"
          change="+18%"
          sub={t("versus", lang)}
          positive
        />
        <KpiCard
          label={lang === "pt" ? "Visitas hoje" : "Visits today"}
          value="1,438"
          change="+12%"
          sub={t("versus", lang)}
          positive
        />
        <KpiCard
          label={lang === "pt" ? "Taxa de conversão" : "Conversion rate"}
          value="3.2%"
          change="-0.4%"
          sub={t("versus", lang)}
          positive={false}
        />
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Revenue chart */}
        <div
          style={{
            background: C.white,
            padding: 24,
            borderRadius: 8,
            border: `1px solid ${C.rule}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 3,
                  color: C.goldDeep,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {t("weekTrend", lang)}
              </div>
              <div
                style={{
                  fontFamily: F.display,
                  fontSize: 22,
                  color: C.ink,
                  marginTop: 4,
                }}
              >
                {lang === "pt" ? "Receita por dia" : "Daily revenue"}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.success,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <TrendingUp size={12} />
              +24%{" "}
              {t("versus", lang)
                .replace(
                  "vs ontem",
                  lang === "pt" ? "vs semana passada" : "vs last week",
                )
                .replace("vs yesterday", "vs last week")}
            </div>
          </div>
          <RevenueChart lang={lang} />
        </div>

        {/* Recent orders */}
        <div
          style={{
            background: C.white,
            padding: 24,
            borderRadius: 8,
            border: `1px solid ${C.rule}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
            }}
          >
            <div style={{ fontFamily: F.display, fontSize: 18, color: C.ink }}>
              {t("recentOrders", lang)}
            </div>
            <button
              onClick={() => setScreen("orders")}
              style={{
                fontSize: 10,
                color: C.goldDeep,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {t("viewAll", lang)} →
            </button>
          </div>
          {ORDERS.slice(0, 5).map((o) => (
            <div
              key={o.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: `1px solid ${C.rule}`,
                fontSize: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: C.ink, fontSize: 12 }}>
                  {o.id}
                </div>
                <div style={{ color: C.inkSoft, fontSize: 11, marginTop: 1 }}>
                  {o.customer}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontWeight: 600, color: C.goldDeep, fontSize: 12 }}
                >
                  Kz {(o.total / 1000).toFixed(0)}K
                </div>
                <StatusBadge status={o.status} lang={lang} small />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row: top products + AI insight */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div
          style={{
            background: C.white,
            padding: 24,
            borderRadius: 8,
            border: `1px solid ${C.rule}`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: 3,
              color: C.goldDeep,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {t("topProducts", lang)}
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 18,
              color: C.ink,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            {lang === "pt"
              ? "Mais vendidos esta semana"
              : "Best sellers this week"}
          </div>
          {PRODUCTS.slice(0, 4).map((p, i) => {
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < 3 ? `1px solid ${C.rule}` : "none",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 44,
                    background: p.tone,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ProductSilhouette cat={p.cat} tone={C.goldDeep} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft }}>
                    {34 - i * 6} {t("units", lang)} · Kz{" "}
                    {(p.priceKz / 1000).toFixed(0)}K
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.success,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <TrendingUp size={10} />+{18 - i * 4}%
                </div>
              </div>
            );
          })}
        </div>

        {/* AI insight card */}
        <div
          style={{
            background: C.noir,
            color: C.cream,
            padding: 24,
            borderRadius: 8,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 3,
              height: "100%",
              background: C.gold,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Sparkles size={14} color={C.gold} />
            <div
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: C.gold,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {lang === "pt" ? "A IA sugere" : "AI suggests"}
            </div>
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 18,
              lineHeight: 1.3,
              marginBottom: 14,
            }}
          >
            {lang === "pt"
              ? '"O Vestido Marés em S está esgotado e tem 32 pessoas na lista de espera. Reponha 40 unidades para evitar perder vendas."'
              : '"The Marés Dress in S is sold out with 32 people on the waitlist. Restock 40 units to avoid lost sales."'}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                padding: "8px 14px",
                background: C.gold,
                color: C.noir,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                borderRadius: 4,
              }}
            >
              {lang === "pt" ? "Repor stock" : "Restock"} →
            </button>
            <button
              style={{
                padding: "8px 14px",
                fontSize: 11,
                color: C.goldLight,
                borderRadius: 4,
                border: `1px solid rgba(203,169,69,0.3)`,
              }}
            >
              {lang === "pt" ? "Ignorar" : "Dismiss"}
            </button>
          </div>
        </div>
      </div>

      {/* Marketing & messages quick access */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div
          style={{
            padding: 20,
            background: C.goldGhost,
            borderRadius: 8,
            border: `1px solid ${C.gold}`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
          onClick={() => setScreen("marketing")}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={20} color={C.white} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
              {MARKETING_DRAFTS.length}{" "}
              {lang === "pt" ? "rascunhos a aguardar" : "drafts awaiting"}
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
              {lang === "pt"
                ? "IG, TikTok, email e WhatsApp prontos a rever"
                : "IG, TikTok, email, and WhatsApp ready to review"}
            </div>
          </div>
          <ArrowUpRight size={16} color={C.goldDeep} />
        </div>
        <div
          style={{
            padding: 20,
            background: C.white,
            borderRadius: 8,
            border: `1px solid ${C.rule}`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
          onClick={() => setScreen("messages")}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: C.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageSquare size={20} color={C.gold} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
              {ESCALATIONS.length}{" "}
              {lang === "pt" ? "mensagens encaminhadas" : "escalated messages"}
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
              {lang === "pt"
                ? "A IA resolveu 47 hoje, estas precisam de si"
                : "AI handled 47 today, these need you"}
            </div>
          </div>
          <ArrowUpRight size={16} color={C.goldDeep} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, change, sub, positive }) {
  return (
    <div
      style={{
        background: C.white,
        padding: 18,
        borderRadius: 8,
        border: `1px solid ${C.rule}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: C.inkSoft,
          fontWeight: 500,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 30,
          color: C.ink,
          fontWeight: 600,
          marginTop: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: positive ? C.success : C.alert,
          fontWeight: 600,
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <TrendingUp
          size={11}
          style={{ transform: positive ? "none" : "rotate(180deg)" }}
        />
        {change}{" "}
        <span style={{ color: C.inkLight, fontWeight: 400 }}>{sub}</span>
      </div>
    </div>
  );
}

function LiveFeedWidget({ lang }) {
  return (
    <div
      style={{
        width: "100%",
        marginBottom: 24,
        background: C.noir,
        color: C.cream,
        borderRadius: 8,
        border: `1px solid rgba(203,169,69,0.28)`,
        overflow: "hidden",
        boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid rgba(203,169,69,0.18)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: C.success,
              boxShadow: `0 0 0 4px rgba(90,143,74,0.18)`,
            }}
          />
          <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
            Live feed
          </span>
        </div>
        <span style={{ fontSize: 10, color: C.goldLight }}>47 online</span>
      </div>
      <div
        style={{
          padding: "8px 14px 10px",
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {LIVE_FEED.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            style={{
              display: "flex",
              gap: 10,
              padding: "8px 0",
              borderLeft: i ? `1px solid rgba(255,255,255,0.08)` : "none",
              paddingLeft: i ? 12 : 0,
              fontSize: 11,
              lineHeight: 1.4,
              minWidth: 0,
            }}
          >
            <span style={{ color: C.goldLight, fontWeight: 700 }}>{item.market}</span>
            <span style={{ flex: 1 }}>
              <strong style={{ color: C.white }}>{item.name}</strong> {item.action[lang]}
            </span>
            <span style={{ color: C.inkLight }}>{item.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAnalytics({ lang }) {
  const funnel = [
    { label: lang === "pt" ? "Visitas" : "Visits", value: 1438, pct: 100 },
    { label: lang === "pt" ? "Produto visto" : "Product views", value: 812, pct: 56 },
    { label: lang === "pt" ? "Carrinho" : "Add to cart", value: 226, pct: 16 },
    { label: lang === "pt" ? "Checkout" : "Checkout", value: 91, pct: 6 },
    { label: lang === "pt" ? "Compra" : "Purchase", value: 47, pct: 3.2 },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: F.display, fontSize: 30, color: C.ink, fontWeight: 500 }}>
          {t("analytics", lang)}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
          {lang === "pt" ? "Receita, conversão e comportamento por mercado." : "Revenue, conversion, and behaviour by market."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: C.white, padding: 24, borderRadius: 8, border: `1px solid ${C.rule}` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: C.goldDeep, textTransform: "uppercase", fontWeight: 700 }}>
            {lang === "pt" ? "Receita por mercado" : "Revenue by market"}
          </div>
          <div style={{ marginTop: 18 }}>
            {ANALYTICS_MARKETS.map((m) => (
              <div key={m.market} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
                  <span style={{ fontWeight: 600 }}>{m.market}</span>
                  <span style={{ color: C.goldDeep, fontWeight: 700 }}>{m.revenue} · {m.orders} {t("orders", lang).toLowerCase()}</span>
                </div>
                <div style={{ height: 12, background: C.creamDeep, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${m.share}%`, height: "100%", background: C.gold }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.white, padding: 24, borderRadius: 8, border: `1px solid ${C.rule}` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: C.goldDeep, textTransform: "uppercase", fontWeight: 700 }}>
            {lang === "pt" ? "Funil de conversão" : "Conversion funnel"}
          </div>
          <div style={{ marginTop: 16 }}>
            {funnel.map((f) => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span>{f.label}</span>
                  <strong>{f.value.toLocaleString("pt-PT")}</strong>
                </div>
                <div style={{ height: 8, background: C.creamDeep, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${f.pct}%`, height: "100%", background: f.label === (lang === "pt" ? "Compra" : "Purchase") ? C.success : C.goldLight }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16 }}>
        <div style={{ background: C.white, padding: 24, borderRadius: 8, border: `1px solid ${C.rule}` }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: C.goldDeep, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
            {lang === "pt" ? "Receita diária" : "Daily revenue"}
          </div>
          <RevenueChart lang={lang} />
        </div>
        <div style={{ background: C.noir, color: C.cream, padding: 24, borderRadius: 8 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
            {lang === "pt" ? "Top clientes" : "Top customers"}
          </div>
          {ORDERS.slice(0, 5).map((o, i) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? `1px solid rgba(255,255,255,0.1)` : "none", fontSize: 12 }}>
              <span>{o.customer}</span>
              <strong style={{ color: C.gold }}>Kz {(o.total / 1000).toFixed(0)}K</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tiny SVG revenue chart
function RevenueChart({ lang }) {
  const data = [42, 38, 56, 49, 68, 84, 92];
  const days =
    lang === "pt"
      ? ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]
      : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const W = 600,
    H = 200,
    pad = 30;
  const max = Math.max(...data) * 1.2;
  const stepX = (W - 2 * pad) / (data.length - 1);
  const pts = data.map((v, i) => [
    pad + i * stepX,
    H - pad - (v / max) * (H - 2 * pad),
  ]);
  const path = pts
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(" ");
  const areaPath = `${path} L ${pts[pts.length - 1][0]} ${H - pad} L ${pts[0][0]} ${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 200 }}>
      <defs>
        <linearGradient id="gradFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.gold} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line
          key={i}
          x1={pad}
          y1={pad + f * (H - 2 * pad)}
          x2={W - pad}
          y2={pad + f * (H - 2 * pad)}
          stroke={C.rule}
          strokeWidth="1"
          strokeDasharray="2,4"
        />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#gradFill)" />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={C.gold}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle
            cx={p[0]}
            cy={p[1]}
            r="4"
            fill={C.white}
            stroke={C.gold}
            strokeWidth="2"
          />
        </g>
      ))}
      {/* Day labels */}
      {days.map((d, i) => (
        <text
          key={d}
          x={pad + i * stepX}
          y={H - 8}
          textAnchor="middle"
          fontSize="10"
          fill={C.inkLight}
          fontFamily={F.body}
          fontWeight="600"
          letterSpacing="1"
        >
          {d}
        </text>
      ))}
      {/* Value labels at peaks */}
      {data.map((v, i) => (
        <text
          key={i}
          x={pts[i][0]}
          y={pts[i][1] - 10}
          textAnchor="middle"
          fontSize="9"
          fill={C.goldDeep}
          fontFamily={F.body}
          fontWeight="600"
        >
          {v}K
        </text>
      ))}
    </svg>
  );
}

function StatusBadge({ status, lang, small = false }) {
  const styles = {
    novo: { bg: C.goldGhost, color: C.goldDeep },
    processando: { bg: "#FFF1D6", color: "#9B6A00" },
    enviado: { bg: "#E0EDFF", color: "#1A5BC8" },
    entregue: { bg: "#E0F4DC", color: C.success },
  };
  const s = styles[status] || styles.novo;
  return (
    <span
      style={{
        display: "inline-block",
        padding: small ? "2px 6px" : "3px 8px",
        background: s.bg,
        color: s.color,
        fontSize: small ? 9 : 10,
        fontWeight: 600,
        letterSpacing: 0.5,
        borderRadius: 3,
        textTransform: "uppercase",
        marginTop: small ? 3 : 0,
      }}
    >
      {t(status, lang)}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function AdminOrders({ lang, onSelectOrder }) {
  const [filter, setFilter] = useState("all");
  const filtered =
    filter === "all" ? ORDERS : ORDERS.filter((o) => o.status === filter);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 30,
            color: C.ink,
            fontWeight: 500,
          }}
        >
          {t("orders", lang)}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
          {lang === "pt"
            ? `${ORDERS.length} encomendas no total`
            : `${ORDERS.length} orders total`}
        </div>
      </div>

      <div style={{ padding: 14, background: C.goldGhost, border: `1px solid ${C.gold}`, borderRadius: 8, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>{lang === "pt" ? "Pagamento por rever" : "Payment review"}</strong>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 3 }}>#1045 · Multicaixa Express · {lang === "pt" ? "confirmação manual pendente" : "manual confirmation pending"}</div>
        </div>
        <button style={{ padding: "8px 12px", background: C.ink, color: C.gold, borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{lang === "pt" ? "Rever" : "Review"}</button>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[
          {
            key: "all",
            label: lang === "pt" ? "Todas" : "All",
            count: ORDERS.length,
          },
          {
            key: "novo",
            label: t("novo", lang),
            count: ORDERS.filter((o) => o.status === "novo").length,
          },
          {
            key: "processando",
            label: t("processando", lang),
            count: ORDERS.filter((o) => o.status === "processando").length,
          },
          {
            key: "enviado",
            label: t("enviado", lang),
            count: ORDERS.filter((o) => o.status === "enviado").length,
          },
          {
            key: "entregue",
            label: t("entregue", lang),
            count: ORDERS.filter((o) => o.status === "entregue").length,
          },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "7px 12px",
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 4,
              border: `1px solid ${filter === f.key ? C.ink : C.rule}`,
              background: filter === f.key ? C.ink : C.white,
              color: filter === f.key ? C.gold : C.ink,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {f.label}
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                background: filter === f.key ? C.gold : C.creamDeep,
                color: filter === f.key ? C.noir : C.inkSoft,
                padding: "1px 5px",
                borderRadius: 8,
              }}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: C.white,
          borderRadius: 8,
          border: `1px solid ${C.rule}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr 140px 100px 80px 130px 30px",
            gap: 12,
            padding: "12px 18px",
            background: C.creamDeep,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: C.inkSoft,
            textTransform: "uppercase",
          }}
        >
          <div>ID</div>
          <div>{t("customer", lang)}</div>
          <div>{lang === "pt" ? "Localização" : "Location"}</div>
          <div style={{ textAlign: "right" }}>{t("total", lang)}</div>
          <div>{lang === "pt" ? "Peças" : "Items"}</div>
          <div>{t("status", lang)}</div>
          <div></div>
        </div>
        {filtered.map((o) => (
          <div
            key={o.id}
            onClick={() => onSelectOrder(o)}
            className="ump-hover-lift"
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 140px 100px 80px 130px 30px",
              gap: 12,
              padding: "14px 18px",
              borderTop: `1px solid ${C.rule}`,
              fontSize: 13,
              color: C.ink,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 600, fontFamily: F.mono, fontSize: 12 }}>
              {o.id}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{o.customer}</div>
              <div style={{ fontSize: 11, color: C.inkLight, marginTop: 1 }}>
                {o.when}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "1px 5px",
                  background: C.creamDeep,
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  marginRight: 6,
                }}
              >
                {o.market === "AO" ? "🇦🇴" : "🇵🇹"}
              </span>
              {o.city}
            </div>
            <div
              style={{ textAlign: "right", fontWeight: 600, color: C.goldDeep }}
            >
              Kz {(o.total / 1000).toFixed(0)}K
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft }}>
              {o.items}{" "}
              {o.items === 1
                ? lang === "pt"
                  ? "peça"
                  : "item"
                : lang === "pt"
                  ? "peças"
                  : "items"}
            </div>
            <div>
              <StatusBadge status={o.status} lang={lang} />
            </div>
            <div style={{ color: C.inkLight }}>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOrderDetail({ order, lang, onBack }) {
  return (
    <div style={{ padding: 32 }}>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: C.goldDeep,
          marginBottom: 18,
          fontWeight: 600,
        }}
      >
        <ChevronLeft size={14} /> {t("back", lang)}
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: C.goldDeep,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {lang === "pt" ? "Encomenda" : "Order"}
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 32,
              color: C.ink,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {order.id}
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
            {order.customer} · {order.when} · {order.city}
          </div>
        </div>
        <StatusBadge status={order.status} lang={lang} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Items */}
        <div
          style={{
            background: C.white,
            padding: 24,
            borderRadius: 8,
            border: `1px solid ${C.rule}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: C.goldDeep,
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            {lang === "pt" ? "Peças encomendadas" : "Items ordered"}
          </div>
          {order.items_detail.map((it, i) => {
            const p = PRODUCTS.find((p) => p.name === it.name);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "14px 0",
                  borderBottom:
                    i < order.items_detail.length - 1
                      ? `1px solid ${C.rule}`
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 80,
                    background: p?.tone || C.shell,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ProductSilhouette cat={p?.cat || "vestidos"} tone={C.goldDeep} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: F.display,
                      fontSize: 16,
                      color: C.ink,
                      fontWeight: 500,
                    }}
                  >
                    {it.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3 }}>
                    {it.size} · {it.color}
                  </div>
                  <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>
                    {lang === "pt" ? "Quantidade" : "Quantity"}: {it.qty}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: C.goldDeep }}
                  >
                    Kz {((it.price * it.qty) / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "14px 0 0",
              marginTop: 4,
              borderTop: `1px solid ${C.rule}`,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span>{t("total", lang)}</span>
            <span
              style={{ fontFamily: F.display, color: C.goldDeep, fontSize: 22 }}
            >
              Kz {(order.total / 1000).toFixed(0)}K
            </span>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div
            style={{
              background: C.white,
              padding: 20,
              borderRadius: 8,
              border: `1px solid ${C.rule}`,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: C.goldDeep,
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {t("customer", lang)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
              {order.customer}
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 6 }}>
              maria.s@example.com
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft }}>
              +{order.market === "AO" ? "244 923 456 789" : "351 923 456 789"}
            </div>
            <button
              style={{
                marginTop: 12,
                fontSize: 11,
                color: C.goldDeep,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Eye size={12} />{" "}
              {lang === "pt" ? "Histórico de encomendas" : "Order history"}
            </button>
          </div>
          <div
            style={{
              background: C.white,
              padding: 20,
              borderRadius: 8,
              border: `1px solid ${C.rule}`,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: C.goldDeep,
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {t("delivery", lang)}
            </div>
            <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
              {order.market === "AO"
                ? "Rua do Cassequel, 123"
                : "Rua das Flores, 45"}
              <br />
              {order.city}, {order.market === "AO" ? "Angola" : "Portugal"}
            </div>
          </div>
          <div style={{ background: C.white, padding: 20, borderRadius: 8, border: `1px solid ${C.rule}`, marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>
              {lang === "pt" ? "Linha temporal" : "Timeline"}
            </div>
            {[
              [lang === "pt" ? "Pago" : "Paid", "09:12"],
              [lang === "pt" ? "A processar" : "Processing", "09:18"],
              [lang === "pt" ? "Preparado" : "Packed", "11:40"],
              [lang === "pt" ? "Enviado" : "Shipped", order.status === "novo" ? "—" : "14:05"],
            ].map(([label, time]) => (
              <div key={label} style={{ display: "flex", gap: 9, padding: "6px 0", fontSize: 11, color: C.inkSoft }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: time === "—" ? C.rule : C.gold, marginTop: 2 }} />
                <span style={{ flex: 1, color: C.ink }}>{label}</span>
                <span>{time}</span>
              </div>
            ))}
          </div>
          <button
            style={{
              width: "100%",
              padding: "14px",
              background: C.ink,
              color: C.gold,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 4,
            }}
          >
            {order.status === "novo"
              ? lang === "pt"
                ? "Marcar como processado"
                : "Mark as processing"
              : order.status === "processando"
                ? lang === "pt"
                  ? "Marcar como enviado"
                  : "Mark as shipped"
                : order.status === "enviado"
                  ? lang === "pt"
                    ? "Marcar como entregue"
                    : "Mark as delivered"
                  : lang === "pt"
                    ? "Ver fatura"
                    : "View invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function AdminProducts({ lang }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const blankProduct = {
    id: "new",
    name: "",
    cat: "vestidos",
    priceKz: "",
    priceEur: "",
    sizes: ["S", "M", "L"],
    colors: [],
    stock: {},
    tag: "RASCUNHO",
    tone: C.goldGhost,
    isNew: true,
  };

  if (selectedProduct) {
    return (
      <AdminProductEditor
        product={selectedProduct}
        lang={lang}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 30,
              color: C.ink,
              fontWeight: 500,
            }}
          >
            {t("products", lang)}
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
            {PRODUCTS.length}{" "}
            {lang === "pt" ? "produtos no catálogo" : "products in catalog"}
          </div>
        </div>
        <button
          onClick={() => setSelectedProduct(blankProduct)}
          style={{
            padding: "10px 16px",
            background: C.ink,
            color: C.gold,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={14} /> {t("addProduct", lang)}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {PRODUCTS.map((p) => {
          const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0);
          const isLow = totalStock < 10;
          return (
            <div
              key={p.id}
              className="ump-hover-lift"
              onClick={() => setSelectedProduct(p)}
              style={{
                background: C.white,
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${C.rule}`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  height: 180,
                  background: p.tone,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <ProductSilhouette cat={p.cat} tone={C.goldDeep} />
                {p.tag && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      background: C.ink,
                      color: C.gold,
                      fontSize: 8,
                      letterSpacing: 1,
                      padding: "3px 6px",
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    {p.tag}
                  </div>
                )}
                <button
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MoreVertical size={14} color={C.ink} />
                </button>
              </div>
              <div style={{ padding: 14 }}>
                <div
                  style={{
                    fontFamily: F.display,
                    fontSize: 16,
                    color: C.ink,
                    fontWeight: 500,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.goldDeep,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  Kz {(p.priceKz / 1000).toFixed(1)}K
                </div>
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${C.rule}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11,
                    color: isLow ? C.alert : C.inkSoft,
                    fontWeight: isLow ? 600 : 400,
                  }}
                >
                  <span>
                    {totalStock} {t("units", lang)}
                  </span>
                  {isLow && (
                    <span style={{ color: C.alert }}>
                      ● {lang === "pt" ? "Stock baixo" : "Low stock"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminProductEditor({ product, lang, onBack }) {
  const sizes = ["XS", "S", "M", "L", "XL"];
  const isNew = product.isNew;

  return (
    <div style={{ padding: 32 }}>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: C.goldDeep,
          marginBottom: 18,
          fontWeight: 600,
        }}
      >
        <ChevronLeft size={14} /> {t("back", lang)}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 30, color: C.ink, fontWeight: 500 }}>
            {isNew
              ? lang === "pt"
                ? "Adicionar produto"
                : "Add product"
              : lang === "pt"
                ? "Editar produto"
                : "Edit product"}
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
            {isNew
              ? lang === "pt"
                ? "Crie uma nova peça e deixe-a em rascunho ou pronta para publicar."
                : "Create a new piece and leave it drafted or ready to publish."
              : lang === "pt" ? "Catálogo, preços e stock por tamanho." : "Catalog, prices, and stock by size."}
          </div>
        </div>
        <button
          style={{
            padding: "10px 18px",
            background: C.ink,
            color: C.gold,
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {isNew
            ? lang === "pt"
              ? "Criar produto"
              : "Create product"
            : lang === "pt"
              ? "Guardar"
              : "Save"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ height: 360, background: product.tone, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ProductSilhouette cat={product.cat} tone={C.goldDeep} />
          </div>
          <button
            style={{
              width: "100%",
              padding: 14,
              background: C.creamDeep,
              color: C.goldDeep,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {isNew
              ? lang === "pt"
                ? "Adicionar fotos"
                : "Add photos"
              : lang === "pt" ? "Substituir foto" : "Replace photo"}
          </button>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 24 }}>
          {isNew && (
            <div style={{ padding: 14, background: C.goldGhost, borderRadius: 6, marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <Sparkles size={16} color={C.goldDeep} />
              <div style={{ fontSize: 12, color: C.goldDeep, lineHeight: 1.5 }}>
                {lang === "pt"
                  ? "Dica IA: depois de guardar, posso gerar legenda IG, hook TikTok e alerta WhatsApp para a nova peça."
                  : "AI tip: after saving, I can generate an IG caption, TikTok hook, and WhatsApp alert for the new item."}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12 }}>
            <Field label={lang === "pt" ? "Nome" : "Name"} placeholder={lang === "pt" ? "Ex: Vestido Celeste" : "Ex: Celeste Dress"} defaultValue={product.name} />
            <Field label="Kz" placeholder="18500" defaultValue={product.priceKz} />
            <Field label="EUR" placeholder="22" defaultValue={product.priceEur} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={lang === "pt" ? "Categoria" : "Category"} defaultValue={product.cat} />
            <Field label={t("status", lang)} defaultValue={product.tag || "Publicado"} />
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: C.goldDeep, textTransform: "uppercase", marginBottom: 8 }}>
              {t("size", lang)}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {sizes.map((s) => (
                <button
                  key={s}
                  style={{
                    minWidth: 42,
                    padding: "9px 10px",
                    borderRadius: 4,
                    border: `1px solid ${product.sizes.includes(s) ? C.ink : C.rule}`,
                    background: product.sizes.includes(s) ? C.ink : C.white,
                    color: product.sizes.includes(s) ? C.gold : C.inkLight,
                    fontWeight: 700,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Field label={t("color", lang)} defaultValue={product.colors.join(", ")} />

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: C.goldDeep, textTransform: "uppercase", marginBottom: 8 }}>
              {lang === "pt" ? "Stock por tamanho" : "Stock by size"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {sizes.map((s) => (
                <div key={s}>
                  <div style={{ fontSize: 10, color: C.inkSoft, marginBottom: 4 }}>{s}</div>
                  <input
                    defaultValue={product.stock[s] ?? 0}
                    style={{
                      width: "100%",
                      padding: "10px 8px",
                      border: `1px solid ${C.rule}`,
                      borderRadius: 4,
                      fontSize: 13,
                      color: C.ink,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {isNew && (
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.rule}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: C.goldDeep, textTransform: "uppercase", marginBottom: 10 }}>
                {lang === "pt" ? "Próximos passos" : "Next steps"}
              </div>
              {[
                lang === "pt" ? "Guardar como rascunho" : "Save as draft",
                lang === "pt" ? "Gerar conteúdo de lançamento" : "Generate launch content",
                lang === "pt" ? "Publicar na homepage" : "Publish to homepage",
              ].map((step, i) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", fontSize: 12, color: C.inkSoft }}>
                  <span style={{ width: 18, height: 18, borderRadius: 9, background: i === 0 ? C.gold : C.creamDeep, color: i === 0 ? C.noir : C.inkLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminCustomers({ lang }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: F.display, fontSize: 30, color: C.ink, fontWeight: 500 }}>
          {t("customers", lang)}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
          {lang === "pt" ? "VIPs, clientes recorrentes, listas de espera e acesso antecipado." : "VIPs, repeat buyers, waitlists, and early access segments."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          [lang === "pt" ? "Clientes totais" : "Total customers", "2,418"],
          ["VIP", "84"],
          [lang === "pt" ? "Em lista de espera" : "On waitlist", "132"],
          [lang === "pt" ? "Recompra" : "Repeat rate", "38%"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 10, color: C.inkSoft, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontFamily: F.display, fontSize: 30, color: C.ink, marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 110px 90px 130px 110px", gap: 14, alignItems: "center", padding: "12px 20px", background: C.creamDeep, borderBottom: `1px solid ${C.rule}` }}>
          {[
            lang === "pt" ? "Cliente" : "Customer",
            lang === "pt" ? "Mercado" : "Market",
            lang === "pt" ? "Segmento" : "Segment",
            lang === "pt" ? "Pedidos" : "Orders",
            lang === "pt" ? "Total gasto" : "Lifetime spend",
            lang === "pt" ? "Interesse" : "Interest",
          ].map((label) => (
            <div key={label} style={{ fontSize: 10, color: C.inkSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 800 }}>
              {label}
            </div>
          ))}
        </div>
        {CUSTOMERS.map((c, i) => (
          <div key={c.name} onClick={() => setSelected(c)} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 110px 90px 130px 110px", gap: 14, alignItems: "center", padding: "16px 20px", borderTop: i ? `1px solid ${C.rule}` : "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 19, background: c.segment === "VIP" ? C.gold : C.creamDeep, color: c.segment === "VIP" ? C.noir : C.goldDeep, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>{c.lastSeen}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.goldDeep }}>{c.market}</div>
            <div>
              <span style={{ padding: "4px 7px", borderRadius: 3, background: c.segment === "VIP" ? C.gold : C.goldGhost, color: c.segment === "VIP" ? C.noir : C.goldDeep, fontSize: 10, fontWeight: 800 }}>
                {c.segment}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.ink }}>{c.orders} {t("orders", lang).toLowerCase()}</div>
            <div style={{ fontSize: 12, color: C.goldDeep, fontWeight: 700 }}>{c.spent}</div>
            <div style={{ fontSize: 11, color: C.inkSoft }}>{c.waitlist}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: 16, background: C.noir, color: C.cream, borderRadius: 8, padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div><div style={{ fontFamily: F.display, fontSize: 24 }}>{selected.name}</div><div style={{ color: C.goldLight, fontSize: 12 }}>{selected.segment} · {selected.market}</div></div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>{lang === "pt" ? "Preferências" : "Preferences"}<br /><strong>{lang === "pt" ? "Tamanho M · Preto/Areia · Vestidos" : "Size M · Black/Sand · Dresses"}</strong></div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>{lang === "pt" ? "Notas WhatsApp" : "WhatsApp notes"}<br /><strong>{lang === "pt" ? "Quer acesso antecipado à próxima coleção." : "Wants early access to next collection."}</strong></div>
        </div>
      )}
    </div>
  );
}

function AdminHomepage({ lang }) {
  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle title={t("homepage", lang)} sub={lang === "pt" ? "Controle o hero, coleções e campanha sazonal sem tocar no código." : "Control the hero, collections, and seasonal campaign without touching code."} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 24 }}>
          <div style={{ height: 240, background: `linear-gradient(135deg, ${C.shell}, ${C.goldGhost})`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <SilhouetteDress tone={C.goldDeep} />
          </div>
          <Field label={lang === "pt" ? "Campanha hero" : "Hero campaign"} defaultValue={lang === "pt" ? "Coleção SS26" : "SS26 Collection"} />
          <Field label={lang === "pt" ? "Headline" : "Headline"} defaultValue={t("brandedTagline", lang)} />
          <button style={{ padding: "12px 16px", background: C.ink, color: C.gold, borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
            {lang === "pt" ? "Publicar homepage" : "Publish homepage"}
          </button>
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 }}>
            {lang === "pt" ? "Blocos ativos" : "Active blocks"}
          </div>
          {["Novidades", "Selecionadas para si", "Editorial", "Instagram feed"].map((block, i) => (
            <div key={block} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderTop: i ? `1px solid ${C.rule}` : "none" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{block}</span>
              <span style={{ fontSize: 10, color: C.success, fontWeight: 800 }}>{lang === "pt" ? "Ativo" : "Active"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminCampaigns({ lang }) {
  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle title={t("campaigns", lang)} sub={lang === "pt" ? "Crie descontos e campanhas que a IA pode sugerir nos momentos certos." : "Create discounts and campaigns AI can suggest at the right moments."} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 24 }}>
          <Field label={lang === "pt" ? "Nome da campanha" : "Campaign name"} defaultValue="Weekend Lookbook" />
          <Field label={lang === "pt" ? "Código" : "Code"} defaultValue="WEEKEND10" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={lang === "pt" ? "Desconto" : "Discount"} defaultValue="10%" />
            <Field label={lang === "pt" ? "Segmento" : "Segment"} defaultValue="VIP + waitlist" />
          </div>
          <button style={{ padding: "12px 16px", background: C.gold, color: C.noir, borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
            {lang === "pt" ? "Agendar campanha" : "Schedule campaign"}
          </button>
        </div>
        <div style={{ background: C.noir, color: C.cream, borderRadius: 8, padding: 24 }}>
          <Sparkles size={16} color={C.gold} />
          <div style={{ fontFamily: F.display, fontSize: 22, marginTop: 12 }}>
            {lang === "pt" ? "A IA recomenda promover Top Lyra: stock parado há 21 dias." : "AI recommends promoting Top Lyra: stock has been slow for 21 days."}
          </div>
          <div style={{ fontSize: 12, color: C.goldLight, marginTop: 12, lineHeight: 1.6 }}>
            {lang === "pt" ? "Sugestão: 10% para clientes que compraram leggings nos últimos 60 dias." : "Suggestion: 10% for customers who bought leggings in the last 60 days."}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800 }}>{lang === "pt" ? "Recuperação de carrinho" : "Abandoned cart recovery"}</div>
          <div style={{ fontFamily: F.display, fontSize: 22, marginTop: 4 }}>Mariana · Vestido Aurora M</div>
          <div style={{ fontSize: 12, color: C.inkSoft }}>{lang === "pt" ? "WhatsApp + email prontos para enviar após 1h." : "WhatsApp + email ready to send after 1h."}</div>
        </div>
        <button style={{ padding: "10px 14px", background: C.gold, color: C.noir, borderRadius: 4, fontSize: 11, fontWeight: 800 }}>{lang === "pt" ? "Aprovar fluxo" : "Approve flow"}</button>
      </div>
    </div>
  );
}

function AdminMetaAds({ lang }) {
  const adProduct = PRODUCTS[0];
  const copyVariants = [
    {
      label: lang === "pt" ? "Nova chegada" : "New arrival",
      text: lang === "pt" ? "O Vestido Aurora acabou de chegar. Movimento, elegância e conforto para todos os dias." : "The Aurora Dress just arrived. Movement, elegance, and comfort for every day.",
    },
    {
      label: lang === "pt" ? "Urgência" : "Urgency",
      text: lang === "pt" ? "Só restam 4 unidades em M. Reserve o seu antes que esgote." : "Only 4 left in M. Reserve yours before it sells out.",
    },
    {
      label: lang === "pt" ? "Lookbook" : "Lookbook",
      text: lang === "pt" ? "Um vestido, três momentos: almoço, trabalho e fim de tarde." : "One dress, three moments: lunch, work, and golden hour.",
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle
        title={t("metaAds", lang)}
        sub={lang === "pt" ? "A IA cria rascunhos para Facebook e Instagram Ads. Raisa aprova antes de lançar." : "AI drafts Facebook and Instagram ads. Raisa approves before launch."}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 16 }}>
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 }}>
            {lang === "pt" ? "Configuração da campanha" : "Campaign setup"}
          </div>
          <Field label={lang === "pt" ? "Produto" : "Product"} defaultValue={adProduct.name} />
          <Field label={lang === "pt" ? "Objetivo" : "Objective"} defaultValue={lang === "pt" ? "Vendas no site" : "Website sales"} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={lang === "pt" ? "Orçamento diário" : "Daily budget"} defaultValue={lang === "pt" ? "Kz 25.000" : "$25"} />
            <Field label={lang === "pt" ? "Duração" : "Duration"} defaultValue={lang === "pt" ? "5 dias" : "5 days"} />
          </div>
          <Field label={lang === "pt" ? "Público" : "Audience"} defaultValue={lang === "pt" ? "Mulheres 18-34 · Luanda + Lisboa · Engajadas no Instagram" : "Women 18-34 · Luanda + Lisbon · Instagram engagers"} />

          <div style={{ padding: 14, background: C.goldGhost, borderRadius: 6, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.goldDeep, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
              <Sparkles size={14} />
              {lang === "pt" ? "Sugestão IA" : "AI suggestion"}
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6, marginTop: 8 }}>
              {lang === "pt" ? "Comece com retargeting de visitantes e carrinhos abandonados. Depois expanda para lookalike de clientes VIP." : "Start with retargeting visitors and abandoned carts. Then expand to a VIP-customer lookalike."}
            </div>
          </div>

          <button style={{ marginTop: 18, width: "100%", padding: "13px 16px", background: C.ink, color: C.gold, borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
            {lang === "pt" ? "Aprovar e lançar" : "Approve & launch"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 16 }}>
          <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800 }}>
                  {lang === "pt" ? "Pré-visualizações criativas" : "Creative previews"}
                </div>
                <div style={{ fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 4 }}>
                  Feed · Story · Carousel
                </div>
              </div>
              <span style={{ fontSize: 10, padding: "5px 8px", background: C.creamDeep, color: C.goldDeep, borderRadius: 4, fontWeight: 800 }}>DRAFT</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 0.62fr 1fr", gap: 12 }}>
              <AdPreviewFrame title="Feed" aspect="1 / 1">
                <div style={{ height: "100%", background: adProduct.tone, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <ProductSilhouette cat={adProduct.cat} tone={C.goldDeep} />
                  <AdTextOverlay top="New arrival" bottom={adProduct.name} />
                </div>
              </AdPreviewFrame>
              <AdPreviewFrame title="Story" aspect="9 / 16">
                <div style={{ height: "100%", background: C.ink, color: C.gold, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12 }}>
                  <ProductSilhouette cat={adProduct.cat} tone={C.gold} />
                  <div style={{ fontFamily: F.display, fontSize: 18, marginTop: 8 }}>Aurora Drop</div>
                  <div style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>Shop now</div>
                </div>
              </AdPreviewFrame>
              <AdPreviewFrame title="Carousel" aspect="1 / 1">
                <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 6, background: C.creamDeep }}>
                  {[adProduct, PRODUCTS[1], PRODUCTS[8], PRODUCTS[4]].map((p) => (
                    <div key={p.id} style={{ background: p.tone, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}><ProductSilhouette cat={p.cat} tone={C.goldDeep} /></div>
                  ))}
                </div>
              </AdPreviewFrame>
            </div>
          </div>

          <div style={{ background: C.noir, color: C.cream, borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 }}>
              {lang === "pt" ? "Variações de copy" : "Copy variants"}
            </div>
            {copyVariants.map((variant, i) => (
              <div key={variant.label} style={{ padding: "12px 0", borderTop: i ? `1px solid rgba(255,255,255,0.12)` : "none" }}>
                <div style={{ fontSize: 11, color: C.goldLight, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>{variant.label}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>{variant.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdPreviewFrame({ title, aspect, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.inkSoft, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
      <div style={{ aspectRatio: aspect, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: "hidden", background: C.cream }}>
        {children}
      </div>
    </div>
  );
}

function AdTextOverlay({ top, bottom }) {
  return (
    <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, padding: 10, background: "rgba(10,10,10,0.86)", color: C.white, borderRadius: 5 }}>
      <div style={{ fontSize: 8, color: C.gold, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 800 }}>{top}</div>
      <div style={{ fontFamily: F.display, fontSize: 18, marginTop: 2 }}>{bottom}</div>
    </div>
  );
}

function AdminInventory({ lang }) {
  const rows = [
    ["Vestido Marés · S", lang === "pt" ? "Esgotado" : "Sold out", lang === "pt" ? "Repor 40 unidades" : "Restock 40 units", C.alert],
    ["Top Lyra · M", lang === "pt" ? "Lento" : "Slow", lang === "pt" ? "Promover em campanha" : "Promote in campaign", C.goldDeep],
    ["Conjunto Aurora · M", lang === "pt" ? "2 dias restantes" : "2 days left", lang === "pt" ? "Reservar fornecedor" : "Reserve supplier", C.success],
  ];
  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle title={t("inventory", lang)} sub={lang === "pt" ? "Previsão de stock, peças lentas e decisões de reposição." : "Stock forecasts, slow movers, and replenishment decisions."} />
      <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: "hidden" }}>
        {rows.map(([item, status, action, color], i) => (
          <div key={item} style={{ display: "grid", gridTemplateColumns: "1.3fr 130px 1fr 120px", gap: 16, alignItems: "center", padding: "18px 22px", borderTop: i ? `1px solid ${C.rule}` : "none" }}>
            <strong>{item}</strong>
            <span style={{ color, fontSize: 12, fontWeight: 800 }}>{status}</span>
            <span style={{ fontSize: 12, color: C.inkSoft }}>{action}</span>
            <button style={{ padding: "8px 10px", background: C.ink, color: C.gold, borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{lang === "pt" ? "Aplicar" : "Apply"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAutomation({ lang }) {
  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle title={t("automation", lang)} sub={lang === "pt" ? "Tudo que a plataforma fez sozinha hoje." : "Everything the platform handled by itself today."} />
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: "hidden" }}>
          {AUTOMATION_LOG.map((log, i) => (
            <div key={log.when} style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px", gap: 14, padding: "16px 20px", borderTop: i ? `1px solid ${C.rule}` : "none", alignItems: "center" }}>
              <strong style={{ color: C.goldDeep }}>{log.when}</strong>
              <span style={{ fontSize: 13 }}>{log.action[lang]}</span>
              <span style={{ fontSize: 10, background: C.goldGhost, color: C.goldDeep, padding: "5px 7px", borderRadius: 4, fontWeight: 800 }}>{log.channel}</span>
            </div>
          ))}
        </div>
        <div style={{ background: C.noir, color: C.cream, borderRadius: 8, padding: 24 }}>
          <Sparkles color={C.gold} size={18} />
          <div style={{ fontFamily: F.display, fontSize: 24, marginTop: 14 }}>{lang === "pt" ? "8h+ poupadas esta semana" : "8h+ saved this week"}</div>
          <div style={{ color: C.goldLight, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{lang === "pt" ? "Atendimento repetitivo, recuperação de carrinhos, rascunhos sociais e alertas de stock." : "Repetitive support, cart recovery, social drafts, and stock alerts."}</div>
        </div>
      </div>
    </div>
  );
}

function AdminTeam({ lang }) {
  const roles = [["Raisa Bandeira", "Owner", "All access"], ["Marta Ops", "Operations", "Orders + customers"], ["Studio Social", "Marketing", "Campaigns + ads"]];
  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle title={t("team", lang)} sub={lang === "pt" ? "Permissões simples para a equipa crescer com a marca." : "Simple permissions as the team grows with the brand."} />
      <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: "hidden" }}>
        {roles.map((r, i) => <div key={r[0]} style={{ display: "grid", gridTemplateColumns: "1fr 150px 1fr", gap: 14, padding: "18px 22px", borderTop: i ? `1px solid ${C.rule}` : "none" }}><strong>{r[0]}</strong><span style={{ color: C.goldDeep, fontWeight: 800 }}>{r[1]}</span><span style={{ color: C.inkSoft }}>{r[2]}</span></div>)}
      </div>
    </div>
  );
}

function AdminSettings({ lang }) {
  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle title={t("settings", lang)} sub={lang === "pt" ? "Mercados, pagamentos, envio e idiomas." : "Markets, payments, shipping, and languages."} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[["Angola", "Kz · Multicaixa · Appy Pay"], ["Portugal", "EUR · Cards · CTT"], ["International", "USD/EUR · Stripe · PayPal"]].map((m) => (
          <div key={m[0]} style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: F.display, fontSize: 24 }}>{m[0]}</div>
            <div style={{ color: C.inkSoft, fontSize: 12, marginTop: 8 }}>{m[1]}</div>
            <button style={{ marginTop: 18, color: C.goldDeep, fontSize: 11, fontWeight: 800 }}>{lang === "pt" ? "Editar regras" : "Edit rules"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminRoadmap({ lang }) {
  const phases = [
    ["1", lang === "pt" ? "Launch" : "Launch", "Weeks 1-6", lang === "pt" ? "Loja, catálogo, pagamentos, encomendas." : "Storefront, catalog, payments, orders."],
    ["2", lang === "pt" ? "Grow" : "Grow", "Weeks 7-12", lang === "pt" ? "Automação, WhatsApp, analytics, loyalty." : "Automation, WhatsApp, analytics, loyalty."],
    ["3", lang === "pt" ? "Optimise" : "Optimise", "Weeks 13-24", lang === "pt" ? "Previsão, recomendações e campanhas inteligentes." : "Forecasting, recommendations, and intelligent campaigns."],
  ];
  return (
    <div style={{ padding: 32 }}>
      <AdminPageTitle title={t("roadmap", lang)} sub={lang === "pt" ? "A construção em fases, alinhada com o blueprint." : "The phased build, aligned with the blueprint."} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {phases.map(([n, title, weeks, body]) => (
          <div key={n} style={{ background: n === "1" ? C.goldGhost : C.white, border: `1px solid ${n === "1" ? C.gold : C.rule}`, borderRadius: 8, padding: 24 }}>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: C.ink, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{n}</div>
            <div style={{ fontFamily: F.display, fontSize: 26, marginTop: 18 }}>{title}</div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800 }}>{weeks}</div>
            <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginTop: 14 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPageTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: F.display, fontSize: 30, color: C.ink, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function AdminMarketing({ lang, marketingState, setMarketingState }) {
  const [view, setView] = useState("queue");

  const handleAction = (id, action) => {
    setMarketingState((prev) => ({ ...prev, [id]: action }));
  };

  const typeIcons = {
    instagram: { bg: "#FFE0EC", color: "#C2185B", label: "IG" },
    tiktok: { bg: C.ink, color: C.gold, label: "TT" },
    email: { bg: "#E0EDFF", color: "#1A5BC8", label: "@" },
    whatsapp: { bg: "#DCF8C6", color: "#0E7A39", label: "WA" },
  };

  const pendingCount = Object.values(marketingState).filter(
    (v) => v === "pending",
  ).length;
  const approvedCount = Object.values(marketingState).filter(
    (v) => v === "approved",
  ).length;
  const skippedCount = Object.values(marketingState).filter(
    (v) => v === "skipped",
  ).length;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 30,
            color: C.ink,
            fontWeight: 500,
          }}
        >
          {t("marketing", lang)}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
          {lang === "pt"
            ? "A IA esboça, você aprova. Tudo publicado tem o seu sinal verde."
            : "AI drafts, you approve. Nothing publishes without your green light."}
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          background: C.white,
          border: `1px solid ${C.rule}`,
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        {[
          { id: "queue", label: lang === "pt" ? "Fila de hoje" : "Today's queue" },
          { id: "calendar", label: lang === "pt" ? "Calendário" : "Calendar" },
        ].map((it) => (
          <button
            key={it.id}
            onClick={() => setView(it.id)}
            style={{
              padding: "9px 14px",
              borderRadius: 5,
              background: view === it.id ? C.ink : "transparent",
              color: view === it.id ? C.gold : C.ink,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {it.label}
          </button>
        ))}
      </div>

      {view === "calendar" ? (
        <MarketingCalendar lang={lang} />
      ) : (
        <>

      {/* Status summary */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            flex: 1,
            padding: 16,
            background: C.goldGhost,
            borderRadius: 8,
            borderLeft: `3px solid ${C.gold}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.goldDeep,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {t("awaitingApproval", lang)}
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 26,
              color: C.ink,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {pendingCount}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: 16,
            background: "#E0F4DC",
            borderRadius: 8,
            borderLeft: `3px solid ${C.success}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.success,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {lang === "pt" ? "Aprovado hoje" : "Approved today"}
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 26,
              color: C.ink,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {approvedCount}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: 16,
            background: C.creamDeep,
            borderRadius: 8,
            borderLeft: `3px solid ${C.inkLight}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.inkSoft,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {lang === "pt" ? "Ignorado" : "Skipped"}
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 26,
              color: C.ink,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {skippedCount}
          </div>
        </div>
      </div>

      {/* Drafts list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {MARKETING_DRAFTS.map((d) => {
          const state = marketingState[d.id];
          const ti = typeIcons[d.type];
          return (
            <div
              key={d.id}
              style={{
                background: C.white,
                borderRadius: 8,
                border: `1px solid ${state === "pending" ? C.gold : C.rule}`,
                overflow: "hidden",
                opacity: state === "skipped" ? 0.5 : 1,
                transition: "opacity 0.3s",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: `1px solid ${C.rule}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: ti.bg,
                      color: ti.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {ti.label}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: C.ink }}
                    >
                      {d.typeLabel[lang]}
                    </div>
                    <div
                      style={{ fontSize: 11, color: C.inkSoft, marginTop: 1 }}
                    >
                      {d.trigger[lang]}
                    </div>
                  </div>
                </div>
                {state === "approved" && (
                  <span
                    style={{
                      fontSize: 10,
                      color: C.success,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Check size={12} />{" "}
                    {lang === "pt" ? "Aprovado" : "Approved"}
                  </span>
                )}
                {state === "skipped" && (
                  <span
                    style={{ fontSize: 10, color: C.inkLight, fontWeight: 600 }}
                  >
                    {lang === "pt" ? "Ignorado" : "Skipped"}
                  </span>
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  padding: 16,
                  background: C.cream,
                  fontSize: 12,
                  color: C.ink,
                  lineHeight: 1.55,
                  whiteSpace: "pre-line",
                  minHeight: 120,
                }}
              >
                {d.content[lang]}
              </div>

              {/* Schedule info */}
              <div
                style={{
                  padding: "10px 16px",
                  background: C.creamDeep,
                  fontSize: 10,
                  color: C.inkSoft,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {t("scheduledFor", lang)}:{" "}
                  <strong style={{ color: C.ink }}>
                    {d.scheduledFor[lang]}
                  </strong>
                </span>
              </div>

              {/* Actions */}
              {state === "pending" && (
                <div
                  style={{ display: "flex", borderTop: `1px solid ${C.rule}` }}
                >
                  <button
                    onClick={() => handleAction(d.id, "approved")}
                    style={{
                      flex: 2,
                      padding: "12px",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: C.success,
                      background: "#F0F9ED",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Check size={14} /> {t("approve", lang)}
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.goldDeep,
                      background: C.goldGhost,
                      borderLeft: `1px solid ${C.rule}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Edit3 size={13} /> {t("edit", lang)}
                  </button>
                  <button
                    onClick={() => handleAction(d.id, "skipped")}
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.inkSoft,
                      background: C.creamDeep,
                      borderLeft: `1px solid ${C.rule}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <SkipForward size={13} /> {t("skip", lang)}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}

function MarketingCalendar({ lang }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {MARKETING_WEEK.map((d, i) => (
          <div
            key={d.day}
            style={{
              minHeight: 190,
              background: i === 4 ? C.goldGhost : C.white,
              border: `1px solid ${i === 4 ? C.gold : C.rule}`,
              borderRadius: 8,
              padding: 14,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 800 }}>
              {d.day}
            </div>
            <div style={{ fontFamily: F.display, fontSize: 18, color: C.ink, marginTop: 14, lineHeight: 1.15 }}>
              {d.title[lang]}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: C.inkSoft, letterSpacing: 1, textTransform: "uppercase" }}>
              {d.channel}
            </div>
            <div style={{ flex: 1 }} />
            <span
              style={{
                alignSelf: "flex-start",
                padding: "4px 7px",
                borderRadius: 3,
                background: d.status === "ready" ? "#E0F4DC" : C.creamDeep,
                color: d.status === "ready" ? C.success : C.inkSoft,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {d.status === "ready"
                ? lang === "pt" ? "Pronto" : "Ready"
                : d.status === "queued"
                  ? lang === "pt" ? "Agendado" : "Queued"
                  : lang === "pt" ? "Rascunho" : "Draft"}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: 20, background: C.noir, color: C.cream, borderRadius: 8, display: "flex", alignItems: "center", gap: 14 }}>
        <Sparkles size={18} color={C.gold} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {lang === "pt" ? "Tudo preparado pela IA, com aprovação manual." : "Everything drafted by AI, with manual approval."}
          </div>
          <div style={{ fontSize: 11, color: C.goldLight, marginTop: 3 }}>
            {lang === "pt" ? "Publicações, emails e WhatsApp organizados numa semana simples." : "Posts, emails, and WhatsApp broadcasts organized into one simple week."}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function AdminMessages({ lang, onSelectMessage }) {
  const [view, setView] = useState("escalated");

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 30,
            color: C.ink,
            fontWeight: 500,
          }}
        >
          {t("messages", lang)}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
          {lang === "pt"
            ? "A IA respondeu a 47 mensagens hoje. Estas precisam de si."
            : "AI replied to 47 messages today. These need you."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
        {[
          ["WhatsApp", "47", lang === "pt" ? "principal em AO/PT" : "primary in AO/PT"],
          ["Instagram DM", "18", lang === "pt" ? "descoberta e styling" : "discovery and styling"],
          ["Facebook", "9", lang === "pt" ? "tracking e devoluções" : "tracking and returns"],
        ].map(([label, count, sub]) => (
          <div key={label} style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800 }}>{label}</div>
            <div style={{ fontFamily: F.display, fontSize: 28, marginTop: 6 }}>{count}</div>
            <div style={{ fontSize: 11, color: C.inkSoft }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16, marginBottom: 18 }}>
        <div style={{ background: C.noir, color: C.cream, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 }}>
            {lang === "pt" ? "Conversa automática" : "Automated conversation"}
          </div>
          {[
            ["customer", lang === "pt" ? "Ainda têm o Vestido Aurora em M?" : "Do you still have the Aurora Dress in M?"],
            ["ai", lang === "pt" ? "Sim, temos 4 unidades. Quer o link para comprar?" : "Yes, 4 left. Would you like the link to order?"],
            ["customer", lang === "pt" ? "Sim. Envia para Luanda?" : "Yes. Does it ship to Luanda?"],
            ["ai", lang === "pt" ? "Entrega em Luanda em 1-2 dias úteis com tracking por SMS." : "Luanda delivery is 1-2 business days with SMS tracking."],
          ].map(([who, text], i) => (
            <div key={i} style={{ display: "flex", justifyContent: who === "ai" ? "flex-start" : "flex-end", marginBottom: 8 }}>
              <div style={{ maxWidth: "78%", padding: "9px 11px", borderRadius: 8, background: who === "ai" ? C.gold : C.ink, color: who === "ai" ? C.noir : C.cream, fontSize: 12, lineHeight: 1.45 }}>
                {text}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, textTransform: "uppercase", fontWeight: 800, marginBottom: 12 }}>
            {lang === "pt" ? "Regras de escalamento" : "Escalation rules"}
          </div>
          {[
            lang === "pt" ? "Reclamações e emoções fortes vão para Raisa." : "Complaints and emotional cases go to Raisa.",
            lang === "pt" ? "Reembolsos nunca são aprovados automaticamente." : "Refunds are never auto-approved.",
            lang === "pt" ? "Clientes VIP são revistos antes do envio." : "VIP customers are reviewed before sending.",
          ].map((rule, i) => (
            <div key={rule} style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: i ? `1px solid ${C.rule}` : "none", fontSize: 12, color: C.inkSoft }}>
              <Check size={14} color={C.success} />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, marginBottom: 18 }}>
        {[
          { id: "escalated", label: lang === "pt" ? "Precisa de si" : "Needs you" },
          { id: "handled", label: lang === "pt" ? "Resolvido pela IA" : "AI handled" },
        ].map((it) => (
          <button
            key={it.id}
            onClick={() => setView(it.id)}
            style={{
              padding: "9px 14px",
              borderRadius: 5,
              background: view === it.id ? C.ink : "transparent",
              color: view === it.id ? C.gold : C.ink,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {it.label}
          </button>
        ))}
      </div>

      {view === "handled" ? (
        <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.rule}`, overflow: "hidden" }}>
          {AI_HANDLED_MESSAGES.map((m, i) => (
            <div key={`${m.from}-${m.when}`} style={{ padding: "18px 22px", borderTop: i ? `1px solid ${C.rule}` : "none", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: "#E0F4DC", color: C.success, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.from} · {m.via}</div>
                <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 3 }}>{m.text[lang]}</div>
              </div>
              <span style={{ fontSize: 10, padding: "4px 7px", background: C.creamDeep, borderRadius: 3, color: C.goldDeep, fontWeight: 800 }}>{m.type}</span>
              <span style={{ fontSize: 11, color: C.inkLight }}>{m.when}</span>
            </div>
          ))}
        </div>
      ) : (
      <div
        style={{
          background: C.white,
          borderRadius: 8,
          border: `1px solid ${C.rule}`,
          overflow: "hidden",
        }}
      >
        {ESCALATIONS.map((e, i) => (
          <div
            key={e.id}
            onClick={() => onSelectMessage(e)}
            style={{
              padding: "18px 22px",
              borderTop: i > 0 ? `1px solid ${C.rule}` : "none",
              display: "flex",
              gap: 16,
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(ev) => (ev.currentTarget.style.background = C.cream)}
            onMouseLeave={(ev) => (ev.currentTarget.style.background = C.white)}
          >
            {/* Avatar */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: C.creamDeep,
                color: C.goldDeep,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {e.from
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                  {e.from}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.inkLight,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {t("via", lang)} {e.via}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    background:
                      e.reason === "vip"
                        ? C.gold
                        : e.reason === "reclamacao"
                          ? "#FFE0E0"
                          : C.goldGhost,
                    color:
                      e.reason === "vip"
                        ? C.white
                        : e.reason === "reclamacao"
                          ? C.alert
                          : C.goldDeep,
                    borderRadius: 3,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {t(e.reason, lang)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.inkSoft,
                  lineHeight: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                "{e.preview[lang]}"
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.inkLight, flexShrink: 0 }}>
              {e.when}
            </div>
            <ChevronRight size={16} color={C.inkLight} />
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

function AdminMessageDetail({ message, lang, onBack }) {
  const [reply, setReply] = useState("");

  return (
    <div style={{ padding: 32 }}>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: C.goldDeep,
          marginBottom: 18,
          fontWeight: 600,
        }}
      >
        <ChevronLeft size={14} /> {t("back", lang)}
      </button>

      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            background: C.creamDeep,
            color: C.goldDeep,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {message.from
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 22,
              color: C.ink,
              fontWeight: 600,
            }}
          >
            {message.from}
          </div>
          <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
            {t("via", lang)} {message.via} · {message.when}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            padding: "4px 10px",
            background:
              message.reason === "vip"
                ? C.gold
                : message.reason === "reclamacao"
                  ? "#FFE0E0"
                  : C.goldGhost,
            color:
              message.reason === "vip"
                ? C.white
                : message.reason === "reclamacao"
                  ? C.alert
                  : C.goldDeep,
            borderRadius: 3,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {t(message.reason, lang)}
        </span>
      </div>

      <div
        style={{
          background: C.white,
          padding: 22,
          borderRadius: 8,
          border: `1px solid ${C.rule}`,
          borderLeft: `3px solid ${C.gold}`,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: C.goldDeep,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          {lang === "pt" ? "Mensagem original" : "Original message"}
        </div>
        <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6 }}>
          "{message.preview[lang]}"
        </div>
      </div>

      <div
        style={{
          background: C.noir,
          color: C.cream,
          padding: 20,
          borderRadius: 8,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <Sparkles size={14} color={C.gold} />
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: C.gold,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {lang === "pt" ? "IA sugere resposta" : "AI suggests reply"}
          </div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {message.reason === "reclamacao" &&
            (lang === "pt"
              ? "Olá Beatriz, lamento muito pelo defeito. Vou enviar uma peça nova imediatamente e organizar a recolha da que recebeu. Sem custos."
              : "Hi Beatriz, I am very sorry about the defect. I will send a replacement immediately and arrange to collect the original. No cost to you.")}
          {message.reason === "sob-medida" &&
            (lang === "pt"
              ? "Olá Mariana, claro! Posso confirmar disponibilidade do atelier para o dia 30. Pode partilhar as suas medidas e o vestido que tem em mente?"
              : "Hi Mariana, of course! I can confirm atelier availability for the 30th. Could you share your measurements and the dress you have in mind?")}
          {message.reason === "devolucao" &&
            (lang === "pt"
              ? "Olá Sofia, sem problema. Vou iniciar a devolução agora — receberá um email com a etiqueta de recolha em 24h."
              : "Hi Sofia, no problem. I will start the return now — you will receive an email with the pickup label within 24h.")}
          {message.reason === "vip" &&
            (lang === "pt"
              ? "Olá Carla! Como cliente VIP, terá acesso antecipado 48h antes do lançamento. Vou adicioná-la à lista — receberá o link privado dia 18."
              : "Hi Carla! As a VIP customer, you have 48h early access before launch. I am adding you to the list — you will receive the private link on the 18th.")}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            style={{
              padding: "8px 14px",
              background: C.gold,
              color: C.noir,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              borderRadius: 4,
            }}
          >
            {lang === "pt" ? "Usar sugestão" : "Use suggestion"}
          </button>
          <button
            style={{
              padding: "8px 14px",
              fontSize: 11,
              color: C.goldLight,
              borderRadius: 4,
              border: `1px solid rgba(203,169,69,0.3)`,
            }}
          >
            {lang === "pt" ? "Reescrever" : "Rewrite"}
          </button>
        </div>
      </div>

      {/* Reply box */}
      <div
        style={{
          background: C.white,
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${C.rule}`,
        }}
      >
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={
            lang === "pt" ? "Escreva a sua resposta..." : "Type your reply..."
          }
          style={{
            width: "100%",
            minHeight: 80,
            border: "none",
            outline: "none",
            fontSize: 13,
            color: C.ink,
            background: "transparent",
            resize: "vertical",
            fontFamily: F.body,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
            paddingTop: 12,
            borderTop: `1px solid ${C.rule}`,
          }}
        >
          <div style={{ fontSize: 11, color: C.inkLight }}>
            {lang === "pt" ? "Responder via" : "Reply via"}{" "}
            <strong>{message.via}</strong>
          </div>
          <button
            style={{
              padding: "8px 16px",
              background: C.ink,
              color: C.gold,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Send size={12} /> {lang === "pt" ? "Enviar" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
