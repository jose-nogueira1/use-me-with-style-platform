import type { MarketSettings, StorefrontContent } from './api';
import type { Market } from '../state/AppContext';
import type { Lang } from '../theme';

export type FaqEntry = {
  question: string;
  answer: string;
  link?: { to: string; label: string };
};

const PAYMENT_NAMES: Record<string, Record<Lang, string>> = {
  paypal: { pt: 'PayPal', en: 'PayPal' },
  stripe: { pt: 'cartão através da Stripe', en: 'card through Stripe' },
  mbway: { pt: 'MB WAY', en: 'MB WAY' },
  multicaixa_express: { pt: 'Multicaixa Express', en: 'Multicaixa Express' },
};

function formatAmount(value: number, market: Market, lang: Lang): string {
  if (market === 'AO') return `${value.toLocaleString(lang === 'pt' ? 'pt-PT' : 'en-US', { maximumFractionDigits: 0 })} Kz`;
  return new Intl.NumberFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(value);
}

function paymentAnswer(market: Market, lang: Lang, settings: MarketSettings | null): string {
  const paymentsEnabled = market === 'AO' ? settings?.angolaPaymentLive : settings?.portugalPaymentsEnabled;
  if (paymentsEnabled === false) {
    return lang === 'pt'
      ? `Na loja ${market === 'AO' ? 'Angola' : 'Portugal'}, a encomenda é criada com o pagamento pendente e o site abre o WhatsApp para coordenar os passos seguintes. A encomenda só fica confirmada depois de o pagamento ser verificado.`
      : `In the ${market === 'AO' ? 'Angola' : 'Portugal'} store, the order is created with payment pending and the site opens WhatsApp to coordinate the next steps. The order is confirmed only after payment is verified.`;
  }

  if (!settings) {
    return lang === 'pt'
      ? 'Os métodos de pagamento disponíveis são apresentados no checkout. A encomenda só fica confirmada depois de o pagamento ser verificado.'
      : 'Available payment methods are shown at checkout. The order is confirmed only after payment is verified.';
  }

  const methods = (market === 'AO' ? settings.angolaPaymentMethods : settings.portugalPaymentMethods)
    .map((method) => PAYMENT_NAMES[method]?.[lang])
    .filter(Boolean);
  const available = methods.length ? methods.join(', ') : (lang === 'pt' ? 'os métodos apresentados no checkout' : 'the methods shown at checkout');
  return lang === 'pt'
    ? `Na loja ${market === 'AO' ? 'Angola' : 'Portugal'} pode pagar com ${available}. A encomenda só fica confirmada depois de o pagamento ser verificado.`
    : `In the ${market === 'AO' ? 'Angola' : 'Portugal'} store you can pay with ${available}. Your order is confirmed only after payment is verified.`;
}

export function buildFaqEntries(market: Market, lang: Lang, settings: MarketSettings | null, content?: StorefrontContent | null): FaqEntry[] {
  if (content?.faqEntries?.length) {
    return content.faqEntries
      .filter((entry) => entry.enabled !== false)
      .map((entry) => {
        const question = (lang === 'en' ? entry.questionEN : entry.questionPT).trim();
        const baseAnswer = lang === 'en' ? entry.answerEN : entry.answerPT;
        const portugalAnswer = lang === 'en' ? entry.answerENPT : entry.answerPTPT;
        const authoredAnswer = (market === 'PT' && portugalAnswer?.trim() ? portugalAnswer : baseAnswer).trim();
        const answer = /pagamento|payment/i.test(question) ? paymentAnswer(market, lang, settings) : authoredAnswer;
        const linkLabel = (lang === 'en' ? entry.linkLabelEN : entry.linkLabelPT)?.trim();
        const linkPath = entry.linkPath?.trim();
        return {
          question,
          answer,
          ...(linkPath?.startsWith('/') && linkLabel ? { link: { to: linkPath, label: linkLabel } } : {}),
        };
      })
      .filter((entry) => entry.question && entry.answer);
  }

  const freeThreshold = market === 'AO'
    ? settings?.angolaFreeShippingThreshold ?? 80_000
    : settings?.portugalFreeShippingThreshold ?? 75;

  const shipping = market === 'AO'
    ? (lang === 'pt'
      ? 'Entregamos por estafeta local nos 16 municípios de Luanda. O custo é calculado pela localização e apresentado no checkout; depois da confirmação, a equipa coordena consigo o horário de entrega. Não prometemos um prazo de 24 horas sem confirmação prévia.'
      : 'We deliver by local courier across Luanda’s 16 municipalities. The fee is calculated from your location and shown at checkout; after confirmation, our team coordinates the delivery time with you. We do not promise 24-hour delivery without prior confirmation.')
    : (lang === 'pt'
      ? 'Em Portugal enviamos pelos CTT. Pode escolher envio Standard sem rastreio ou Registado com rastreio, quando disponível para o peso da encomenda. O custo e o prazo estimado dependem do destino; Madeira e Açores podem demorar mais.'
      : 'In Portugal we ship with CTT. You can choose Standard untracked or Registered tracked delivery when available for the parcel weight. Cost and estimated timing depend on the destination; Madeira and the Azores may take longer.');

  return [
    {
      question: lang === 'pt' ? 'Onde entregam e quanto tempo demora?' : 'Where do you deliver and how long does it take?',
      answer: shipping,
    },
    {
      question: lang === 'pt' ? 'Quanto custa a entrega?' : 'How much does delivery cost?',
      answer: lang === 'pt'
        ? `O valor exato é calculado no checkout antes de confirmar. A entrega é gratuita a partir de ${formatAmount(freeThreshold, market, lang)}, depois de descontos. Também fazemos envios internacionais; contacte o apoio para confirmar custo e prazo para o seu país.`
        : `The exact fee is calculated at checkout before you confirm. Delivery is free from ${formatAmount(freeThreshold, market, lang)}, after discounts. International shipping is also available; contact support to confirm the cost and timing for your country.`,
    },
    {
      question: lang === 'pt' ? 'Que métodos de pagamento aceitam?' : 'Which payment methods do you accept?',
      answer: paymentAnswer(market, lang, settings),
    },
    {
      question: lang === 'pt' ? 'Como escolho o tamanho certo?' : 'How do I choose the right size?',
      answer: lang === 'pt'
        ? 'Abra a página do produto e consulte o guia de tamanhos associado à peça. Compare as suas medidas com a tabela e leia a nota de ajuste quando existir. Se continuar com dúvidas, contacte o apoio antes de encomendar.'
        : 'Open the product page and use the size guide assigned to that item. Compare your measurements with the table and read the fit note when one is provided. If you are still unsure, contact support before ordering.',
      link: { to: '/guia-de-tamanhos', label: lang === 'pt' ? 'Consultar o guia de tamanhos' : 'View the size guide' },
    },
    {
      question: lang === 'pt' ? 'Posso trocar ou devolver um artigo?' : 'Can I exchange or return an item?',
      answer: market === 'AO'
        ? (lang === 'pt'
          ? 'Em Angola, comunique qualquer pedido de troca no prazo máximo de 14 dias após receber a encomenda. A elegibilidade, o estado exigido do artigo, os custos e as exceções constam da política completa.'
          : 'In Angola, tell us about an exchange request within 14 days of receiving the order. Eligibility, required item condition, costs, and exceptions are explained in the full policy.')
        : (lang === 'pt'
          ? 'Em Portugal, as compras online dispõem do prazo legal indicado na nossa política para comunicar a intenção de devolução. O artigo deve cumprir as condições descritas na política completa.'
          : 'In Portugal, online purchases have the legal period stated in our policy to notify us of an intended return. The item must meet the conditions described in the full policy.'),
      link: {
        to: '/ajuda#devolucoes',
        label: lang === 'pt' ? 'Ler a política de trocas e devoluções' : 'Read the returns and exchanges policy',
      },
    },
    {
      question: lang === 'pt' ? 'Como acompanho a minha encomenda?' : 'How do I track my order?',
      answer: lang === 'pt'
        ? 'Use o número da encomenda e o email utilizado na compra na página Consultar encomenda. Em Portugal, o código e o link de rastreio CTT aparecem depois de a encomenda ser enviada, quando o serviço escolhido inclui rastreio.'
        : 'Use your order number and the email used at checkout on the Track order page. In Portugal, the CTT tracking code and link appear after dispatch when your selected service includes tracking.',
      link: { to: '/conta', label: lang === 'pt' ? 'Consultar encomenda' : 'Track order' },
    },
  ];
}

export function buildFaqStructuredData(entries: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };
}
