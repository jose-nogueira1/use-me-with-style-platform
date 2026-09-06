import assert from 'node:assert/strict';
import test from 'node:test';
import { APPROVED_TERMS_PAYMENT_COPY, withApprovedTermsPaymentCopy } from '../src/lib/legalCopy.ts';

test('approved Portuguese payment terms replace only the payment paragraph', () => {
  const original = 'Produtos: texto aprovado.\n\nPreços e pagamento: AppyPay, PayPal e Stripe.\n\nEntrega: texto aprovado.';
  assert.equal(
    withApprovedTermsPaymentCopy(original, 'pt'),
    `Produtos: texto aprovado.\n\n${APPROVED_TERMS_PAYMENT_COPY.pt}\n\nEntrega: texto aprovado.`,
  );
});

test('approved English payment terms replace only the payment paragraph', () => {
  const original = 'Products: approved text.\n\nPrices and payment: AppyPay, PayPal and Stripe.\n\nDelivery: approved text.';
  assert.equal(
    withApprovedTermsPaymentCopy(original, 'en'),
    `Products: approved text.\n\n${APPROVED_TERMS_PAYMENT_COPY.en}\n\nDelivery: approved text.`,
  );
});
