import assert from 'node:assert/strict';
import test from 'node:test';

test('paid AppyPay details are localized and duplicate provider references are hidden', async () => {
  const module = await import('../src/admin/lib/paymentDiagnostics.ts').catch(() => ({}));
  const buildPaymentDiagnostics = 'buildPaymentDiagnostics' in module
    ? module.buildPaymentDiagnostics
    : undefined;

  assert.equal(typeof buildPaymentDiagnostics, 'function');
  if (typeof buildPaymentDiagnostics !== 'function') return;

  const details = buildPaymentDiagnostics({
    paymentReference: 'd6b4dd79-cbe7-4fa1-8024-0e01f75e776d',
    appyPayMerchantTransactionId: 'UMmuI4ig9pec41',
    appyPayTransactionId: 'd6b4dd79-cbe7-4fa1-8024-0e01f75e776d',
    appyPayStatus: 'Success',
    appyPayPaymentMethod: 'GPO',
    appyPayResponseCode: 100,
    appyPayResponseMessage: 'Obrigado! O seu pagamento foi registado com Sucesso.',
    appyPayVerifiedAt: '2026-09-28T10:49:13.000Z',
    inventoryReservationStatus: 'committed',
  }, 'pt');

  assert.equal(details.providerStatus, 'Confirmado');
  assert.equal(details.paymentMethod, 'Multicaixa Express');
  assert.equal(details.inventoryStatus, 'Stock descontado e confirmado');
  assert.equal(details.verifiedAt, '28/09/2026, 11:49');
  assert.deepEqual(details.technicalRows, [
    { key: 'merchantReference', value: 'UMmuI4ig9pec41' },
    { key: 'transactionId', value: 'd6b4dd79-cbe7-4fa1-8024-0e01f75e776d' },
    { key: 'providerResponse', value: '100 — Obrigado! O seu pagamento foi registado com Sucesso.' },
  ]);
});

test('a distinct payment reference remains available in technical details', async () => {
  const { buildPaymentDiagnostics } = await import('../src/admin/lib/paymentDiagnostics.ts');
  const details = buildPaymentDiagnostics({
    paymentReference: 'customer-visible-reference',
    appyPayTransactionId: 'provider-transaction-id',
  }, 'en');

  assert.deepEqual(details.technicalRows, [
    { key: 'paymentReference', value: 'customer-visible-reference' },
    { key: 'transactionId', value: 'provider-transaction-id' },
  ]);
});
