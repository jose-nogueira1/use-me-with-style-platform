import type { StorefrontContent, StorefrontFaqEntry } from './api';

export const DEFAULT_STOREFRONT_CONTENT = {
  homeSeoTitleAngolaPT: 'Moda desportiva feminina em Luanda | Use Me With Style',
  homeSeoTitleAngolaEN: "Women's activewear in Luanda | Use Me With Style",
  homeSeoDescriptionAngolaPT: 'Compre moda desportiva feminina com entrega em Luanda e pagamento por Multicaixa Express ou Referência. Preços em Kz e apoio local.',
  homeSeoDescriptionAngolaEN: "Shop women's activewear with delivery across Luanda and payment by Multicaixa Express or Reference. Prices in Kz and local support.",
  homeSeoTitlePortugalPT: 'Moda desportiva feminina em Portugal | Use Me With Style',
  homeSeoTitlePortugalEN: "Women's activewear in Portugal | Use Me With Style",
  homeSeoDescriptionPortugalPT: 'Compre leggings, conjuntos, tops e vestidos com entrega em Portugal. Peças versáteis para treino e para o dia a dia.',
  homeSeoDescriptionPortugalEN: 'Shop leggings, sets, tops and dresses with delivery across Portugal. Versatile pieces for training and everyday wear.',
  faqTitlePT: 'Perguntas frequentes',
  faqTitleEN: 'Frequently asked questions',
  faqIntroPT: 'Encontre informação prática antes de encomendar. As condições apresentadas acompanham a loja e o mercado que está a visitar.',
  faqIntroEN: 'Find practical information before ordering. The details below follow the store and market you are currently visiting.',
  faqSupportPromptPT: 'Não encontrou a resposta?',
  faqSupportPromptEN: 'Couldn’t find your answer?',
  faqSupportLabelPT: 'Contacte o apoio.',
  faqSupportLabelEN: 'Contact support.',
  faqSeoTitlePT: 'Perguntas frequentes | Use Me With Style',
  faqSeoTitleEN: 'Frequently asked questions | Use Me With Style',
  faqSeoDescriptionPT: 'Respostas sobre entregas, pagamentos, tamanhos, trocas e devoluções da Use Me With Style em Angola e Portugal.',
  faqSeoDescriptionEN: 'Answers about Use Me With Style delivery, payments, sizing, exchanges, and returns in Angola and Portugal.',
  sizeGuideTitlePT: 'Guia de tamanhos',
  sizeGuideTitleEN: 'Size guide',
  sizeGuideIntroPT: 'Encontre o tamanho certo para leggings, tops, vestidos e conjuntos. Tire as suas medidas sem apertar a fita e compare-as, em centímetros, com a tabela da categoria da peça.',
  sizeGuideIntroEN: 'Find the right size for leggings, tops, dresses and sets. Take your measurements without pulling the tape tight, then compare them in centimetres with the chart for your item category.',
  sizeGuideHowToTitlePT: 'Como medir',
  sizeGuideHowToTitleEN: 'How to measure',
  sizeGuideBustPT: 'Busto: meça à volta da parte mais larga do peito.',
  sizeGuideBustEN: 'Bust: measure around the fullest part of your chest.',
  sizeGuideWaistPT: 'Cintura: meça à volta da parte mais estreita do tronco.',
  sizeGuideWaistEN: 'Waist: measure around the narrowest part of your torso.',
  sizeGuideHipPT: 'Anca: meça à volta da parte mais larga das ancas.',
  sizeGuideHipEN: 'Hip: measure around the fullest part of your hips.',
  sizeGuideLengthPT: 'Comprimento: compare com o comprimento indicado para a peça; o ponto inicial varia conforme o tipo de produto.',
  sizeGuideLengthEN: 'Length: compare with the garment length shown; the starting point varies by product type.',
  sizeGuideClosingPT: 'A tabela associada à página de cada produto é sempre a referência principal. Entre dois tamanhos ou ainda com dúvidas?',
  sizeGuideClosingEN: 'The chart assigned to each product page is always the primary reference. Between sizes or still unsure?',
  sizeGuideSupportLabelPT: 'Fale connosco',
  sizeGuideSupportLabelEN: 'Contact us',
  sizeGuideCatalogLabelPT: 'Explorar o catálogo',
  sizeGuideCatalogLabelEN: 'Browse the catalogue',
  sizeGuideSeoTitlePT: 'Guia de tamanhos | Use Me With Style',
  sizeGuideSeoTitleEN: 'Size guide | Use Me With Style',
  sizeGuideSeoDescriptionPT: 'Consulte o guia de tamanhos de leggings, tops, vestidos e conjuntos Use Me With Style e compare busto, cintura e anca em centímetros.',
  sizeGuideSeoDescriptionEN: 'Use our size guide for leggings, tops, dresses and sets, and compare bust, waist and hip measurements in centimetres.',
} as const;

export type NormalizedStorefrontContent = {
  [K in keyof typeof DEFAULT_STOREFRONT_CONTENT]: string;
} & { faqEntries: StorefrontFaqEntry[] };

export function normalizeStorefrontContent(value?: StorefrontContent | null): NormalizedStorefrontContent {
  const scalar = Object.fromEntries(
    Object.entries(DEFAULT_STOREFRONT_CONTENT).map(([key, fallback]) => {
      const candidate = value?.[key as keyof StorefrontContent];
      return [key, typeof candidate === 'string' && candidate.trim() ? candidate : fallback];
    }),
  ) as { [K in keyof typeof DEFAULT_STOREFRONT_CONTENT]: string };
  return { ...scalar, faqEntries: value?.faqEntries?.filter((entry) => entry.questionPT.trim() && entry.questionEN.trim()) ?? [] };
}

export function homeSeoMetadata(market: 'AO' | 'PT', lang: 'pt' | 'en', value?: StorefrontContent | null) {
  const content = normalizeStorefrontContent(value);
  if (market === 'AO') {
    return lang === 'en'
      ? { title: content.homeSeoTitleAngolaEN, description: content.homeSeoDescriptionAngolaEN }
      : { title: content.homeSeoTitleAngolaPT, description: content.homeSeoDescriptionAngolaPT };
  }
  return lang === 'en'
    ? { title: content.homeSeoTitlePortugalEN, description: content.homeSeoDescriptionPortugalEN }
    : { title: content.homeSeoTitlePortugalPT, description: content.homeSeoDescriptionPortugalPT };
}
