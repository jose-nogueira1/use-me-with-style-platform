export const APPROVED_TERMS_PAYMENT_COPY = {
  pt: 'Preços e pagamento: os preços apresentados incluem os impostos aplicáveis, salvo indicação em contrário. Os métodos de pagamento disponíveis variam consoante o mercado (Angola ou Portugal) e são apresentados no checkout. Enquanto os pagamentos online não estiverem ativos, a encomenda pode ser criada com o pagamento pendente e o site abre o WhatsApp para coordenar os passos seguintes. A encomenda só fica confirmada depois de o pagamento ser verificado. Quando um método de pagamento online estiver ativo, será apresentado no checkout e processado de forma segura pelo respetivo parceiro.',
  en: 'Prices and payment: displayed prices include applicable taxes unless otherwise stated. Available payment methods vary by market (Angola or Portugal) and are shown at checkout. While online payments are inactive, an order can be created with payment pending and the site opens WhatsApp to coordinate the next steps. The order is confirmed only after payment is verified. When an online payment method is active, it will be shown at checkout and processed securely by the relevant partner.',
} as const;

/**
 * Applies the business-approved payment paragraph at the presentation layer
 * until the same copy is published in the legal-content CMS global.
 */
export function withApprovedTermsPaymentCopy(text: string | undefined, lang: 'pt' | 'en'): string | undefined {
  if (!text) return text;
  const heading = lang === 'pt' ? 'preços e pagamento:' : 'prices and payment:';
  const paragraphs = text.split(/\r?\n\s*\r?\n/);
  const index = paragraphs.findIndex((paragraph) => paragraph.trim().toLocaleLowerCase(lang === 'pt' ? 'pt-PT' : 'en').startsWith(heading));
  if (index === -1) return text;
  paragraphs[index] = APPROVED_TERMS_PAYMENT_COPY[lang];
  return paragraphs.join('\n\n');
}
