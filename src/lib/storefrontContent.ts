import type { StorefrontAboutValue, StorefrontContent, StorefrontFaqEntry } from './api';

export const DEFAULT_ABOUT_VALUES: StorefrontAboutValue[] = [
  { enabled: true, titlePT: 'Qualidade em primeiro lugar', titleEN: 'Quality first', bodyPT: 'Cada peça é escolhida para durar mais do que uma estação.', bodyEN: 'Every piece is chosen to outlast a single season.' },
  { enabled: true, titlePT: 'Preços diretos', titleEN: 'Honest pricing', bodyPT: 'Sem letras pequenas — o preço que vê é o preço que paga.', bodyEN: 'No fine print — the price you see is the price you pay.' },
  { enabled: true, titlePT: 'Perto de si', titleEN: 'Close to you', bodyPT: 'Duas lojas, uma só marca: Angola e Portugal, cada uma com o seu atendimento.', bodyEN: 'Two storefronts, one brand: Angola and Portugal, each with its own local service.' },
];

export const DEFAULT_STOREFRONT_CONTENT = {
  tiktokUrl: '',
  homeSeoTitleAngolaPT: 'Moda desportiva feminina em Luanda | Use Me With Style',
  homeSeoTitleAngolaEN: "Women's activewear in Luanda | Use Me With Style",
  homeSeoDescriptionAngolaPT: 'Compre moda desportiva feminina com entrega em Luanda e pagamento por Multicaixa Express ou Referência. Preços em Kz e apoio local.',
  homeSeoDescriptionAngolaEN: "Shop women's activewear with delivery across Luanda and payment by Multicaixa Express or Reference. Prices in Kz and local support.",
  homeSeoTitlePortugalPT: 'Moda desportiva feminina em Portugal | Use Me With Style',
  homeSeoTitlePortugalEN: "Women's activewear in Portugal | Use Me With Style",
  homeSeoDescriptionPortugalPT: 'Compre leggings, conjuntos, tops e vestidos com entrega em Portugal. Peças versáteis para treino e para o dia a dia.',
  homeSeoDescriptionPortugalEN: 'Shop leggings, sets, tops and dresses with delivery across Portugal. Versatile pieces for training and everyday wear.',
  aboutEyebrowPT: 'Use Me With Style',
  aboutEyebrowEN: 'Use Me With Style',
  aboutTitlePT: 'A nossa história',
  aboutTitleEN: 'Our story',
  aboutIntroPT: 'A USE ME WITH STYLE é uma marca de activewear, moda feminina e lifestyle, criada para mulheres que valorizam conforto, confiança, elegância e versatilidade.',
  aboutIntroEN: 'USE ME WITH STYLE is an activewear, women’s fashion, and lifestyle brand created for women who value comfort, confidence, elegance, and versatility.',
  aboutStoryTitlePT: 'Missão',
  aboutStoryTitleEN: 'Mission',
  aboutStoryBodyPT: 'A marca disponibiliza peças pensadas para diferentes momentos da rotina feminina, desde o treino e o dia a dia até ocasiões que pedem um visual mais elegante. O nosso catálogo inclui conjuntos desportivos, peças casuais, vestidos e outros artigos selecionados para proporcionar conforto sem perder o estilo.\n\nCom atuação em Angola e Portugal e possibilidade de envios internacionais, a USE ME WITH STYLE procura aproximar mulheres de diferentes lugares através de coleções cuidadosamente selecionadas e disponibilizadas em quantidades limitadas.\n\nMais do que roupa, a USE ME WITH STYLE representa uma forma de vestir com confiança, personalidade e liberdade.',
  aboutStoryBodyEN: "The brand offers pieces designed for different moments in a woman's routine, from workouts and everyday life to occasions that call for a more elegant look. Our catalogue includes activewear sets, casual pieces, dresses, and other selected items designed to deliver comfort without compromising on style.\n\nWith a presence in Angola and Portugal and international shipping available, USE ME WITH STYLE brings women from different places closer together through carefully curated collections released in limited quantities.\n\nMore than just clothing, USE ME WITH STYLE represents a way of dressing with confidence, personality, and freedom.",
  aboutValuesTitlePT: 'O que nos guia',
  aboutValuesTitleEN: 'What guides us',
  aboutPresenceTitlePT: 'Angola e Portugal, perto de si',
  aboutPresenceTitleEN: 'Angola and Portugal, close to you',
  aboutAngolaTitlePT: 'Loja Angola',
  aboutAngolaTitleEN: 'Angola store',
  aboutAngolaBodyPT: 'Na loja Angola, encontra preços em Kz, entrega por estafeta nos 16 municípios de Luanda e pagamento por Multicaixa Express ou Referência. Para outros destinos, o apoio confirma as opções disponíveis.',
  aboutAngolaBodyEN: 'In the Angola store, prices are shown in Kz, with courier delivery across Luanda’s 16 municipalities and payment by Multicaixa Express or Reference. For other destinations, support confirms the available options.',
  aboutPortugalTitlePT: 'Loja Portugal',
  aboutPortugalTitleEN: 'Portugal store',
  aboutPortugalBodyPT: 'Na loja Portugal, compra em euros e recebe via CTT, com opções Standard ou Registado quando disponíveis para o peso da encomenda. Madeira e Açores podem ter prazos diferentes.',
  aboutPortugalBodyEN: 'In the Portugal store, you shop in euros and receive orders through CTT, with Standard or Registered options when available for the parcel weight. Madeira and the Azores may have different delivery times.',
  aboutCtaLabelPT: 'Ver a coleção',
  aboutCtaLabelEN: 'Shop the collection',
  aboutSeoTitlePT: 'Moda desportiva em Angola e Portugal | Use Me With Style',
  aboutSeoTitleEN: 'Activewear in Angola and Portugal | Use Me With Style',
  aboutSeoDescriptionPT: 'Conheça a história e os valores da Use Me With Style, marca de activewear e moda feminina com presença em Angola e Portugal.',
  aboutSeoDescriptionEN: 'Discover the story and values of Use Me With Style, an activewear and women’s fashion brand serving Angola and Portugal.',
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
} & { faqEntries: StorefrontFaqEntry[]; aboutValues: StorefrontAboutValue[] };

export function normalizeStorefrontContent(value?: StorefrontContent | null): NormalizedStorefrontContent {
  const scalar = Object.fromEntries(
    Object.entries(DEFAULT_STOREFRONT_CONTENT).map(([key, fallback]) => {
      const candidate = value?.[key as keyof StorefrontContent];
      return [key, typeof candidate === 'string' && candidate.trim() ? candidate : fallback];
    }),
  ) as { [K in keyof typeof DEFAULT_STOREFRONT_CONTENT]: string };
  return {
    ...scalar,
    faqEntries: value?.faqEntries?.filter((entry) => entry.questionPT.trim() && entry.questionEN.trim()) ?? [],
    aboutValues: value?.aboutValues?.filter((entry) => entry.titlePT.trim() && entry.titleEN.trim()) ?? DEFAULT_ABOUT_VALUES,
  };
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
