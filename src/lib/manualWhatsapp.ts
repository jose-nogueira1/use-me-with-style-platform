import type { ApiOrder, MarketSettings } from './api';

export type ManualWhatsappPayload = { orderNumber: string; url: string; expiresAt?: string };
const storageKey = (orderNumber: string) => `useme:whatsapp:${orderNumber}`;

const templates = {
  pt: 'Olá Use Me With Style 👋\n\nAcabei de fazer uma encomenda no website e gostaria de coordenar o pagamento pelo WhatsApp.\n\nEncomenda: {orderNumber}\nMercado: {market}\nNome: {customerName}\nTotal: {total}\nEntrega: {delivery}\n\nArtigos:\n{items}\n\nPodem, por favor, confirmar os dados para pagamento e entrega?',
  en: 'Hello Use Me With Style 👋\n\nI have just placed an order on the website and would like to arrange payment through WhatsApp.\n\nOrder: {orderNumber}\nMarket: {market}\nName: {customerName}\nTotal: {total}\nDelivery: {delivery}\n\nItems:\n{items}\n\nCould you please confirm the payment and delivery details?',
};

export function buildManualWhatsappPayload(order: ApiOrder, settings: MarketSettings): ManualWhatsappPayload {
  const lang = order.lang === 'en' ? 'en' : 'pt';
  const custom = lang === 'en' ? settings.manualWhatsappMessageEN : settings.manualWhatsappMessagePT;
  const values: Record<string, string> = {
    orderNumber: order.orderNumber,
    market: order.market === 'AO' ? 'Angola' : 'Portugal',
    customerName: order.customerName,
    total: order.currency === 'Kz' ? `${Math.round(order.total).toLocaleString('pt-PT')} Kz` : new Intl.NumberFormat(lang === 'en' ? 'en-IE' : 'pt-PT', { style: 'currency', currency: 'EUR' }).format(order.total),
    delivery: [order.city, order.country].filter(Boolean).join(', '),
    items: order.items.map((item) => { const options = [item.color, item.optionValue ?? item.size].filter(Boolean).join(' / '); return `• ${item.productName}${options ? ` — ${options}` : ''} × ${item.qty}`; }).join('\n'),
  };
  const message = (custom?.trim() || templates[lang]).replace(/\{(orderNumber|market|customerName|total|delivery|items)\}/g, (_, key: string) => values[key] ?? '');
  const configuredNumber = order.market === 'AO' ? settings.angolaWhatsappNumber : settings.portugalWhatsappNumber;
  const number = (configuredNumber || settings.manualWhatsappNumber || '').replace(/\D/g, '');
  return { orderNumber: order.orderNumber, url: `https://wa.me/${number}?text=${encodeURIComponent(message)}`, expiresAt: order.inventoryReservationExpiresAt };
}

export function saveManualWhatsappPayload(payload: ManualWhatsappPayload) {
  try { sessionStorage.setItem(storageKey(payload.orderNumber), JSON.stringify(payload)); } catch { /* best-effort recovery */ }
}

export function loadManualWhatsappPayload(orderNumber: string): ManualWhatsappPayload | null {
  try { const raw = sessionStorage.getItem(storageKey(orderNumber)); return raw ? JSON.parse(raw) as ManualWhatsappPayload : null; } catch { return null; }
}
