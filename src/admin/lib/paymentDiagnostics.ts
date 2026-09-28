import type { ApiOrder } from '../../lib/api';
import type { Lang } from '../i18n';

type PaymentDiagnosticOrder = Pick<ApiOrder,
  | 'paymentReference'
  | 'appyPayMerchantTransactionId'
  | 'appyPayTransactionId'
  | 'appyPayStatus'
  | 'appyPayPaymentMethod'
  | 'appyPayResponseCode'
  | 'appyPayResponseMessage'
  | 'appyPayReferenceEntity'
  | 'appyPayReferenceNumber'
  | 'appyPayReferenceDueDate'
  | 'appyPayVerifiedAt'
  | 'inventoryReservationStatus'
  | 'inventoryReservationExpiresAt'
>;

export type PaymentTechnicalRowKey =
  | 'paymentReference'
  | 'merchantReference'
  | 'transactionId'
  | 'providerResponse'
  | 'providerReference'
  | 'referenceDueDate'
  | 'reservationExpires';

export type PaymentTechnicalRow = { key: PaymentTechnicalRowKey; value: string };

const PROVIDER_STATUS_LABELS: Record<Lang, Record<string, string>> = {
  pt: { success: 'Confirmado', pending: 'Pendente', failed: 'Falhou', cancelled: 'Cancelado' },
  en: { success: 'Confirmed', pending: 'Pending', failed: 'Failed', cancelled: 'Cancelled' },
};

const INVENTORY_STATUS_LABELS: Record<Lang, Record<string, string>> = {
  pt: {
    committed: 'Stock descontado e confirmado',
    reserved: 'Stock reservado temporariamente',
    released: 'Reserva de stock libertada',
    expired: 'Reserva de stock expirada',
  },
  en: {
    committed: 'Stock deducted and confirmed',
    reserved: 'Stock temporarily reserved',
    released: 'Stock reservation released',
    expired: 'Stock reservation expired',
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gpo: 'Multicaixa Express',
  multicaixa_express: 'Multicaixa Express',
  ref: 'Multicaixa reference',
};

function labelFor(value: string | undefined, labels: Record<string, string>): string {
  if (!value) return '';
  return labels[value.toLowerCase()] ?? value;
}

function formatDateTime(value: string | undefined, lang: Lang): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Luanda',
  }).format(date);
}

function formatDate(value: string | undefined, lang: Lang): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Africa/Luanda',
  }).format(date);
}

export function buildPaymentDiagnostics(order: PaymentDiagnosticOrder, lang: Lang) {
  const technicalRows: PaymentTechnicalRow[] = [];

  if (order.paymentReference && order.paymentReference !== order.appyPayTransactionId) {
    technicalRows.push({ key: 'paymentReference', value: order.paymentReference });
  }
  if (order.appyPayMerchantTransactionId) {
    technicalRows.push({ key: 'merchantReference', value: order.appyPayMerchantTransactionId });
  }
  if (order.appyPayTransactionId) {
    technicalRows.push({ key: 'transactionId', value: order.appyPayTransactionId });
  }
  if (order.appyPayResponseCode !== undefined || order.appyPayResponseMessage) {
    technicalRows.push({
      key: 'providerResponse',
      value: [order.appyPayResponseCode, order.appyPayResponseMessage].filter((value) => value !== undefined && value !== '').join(' — '),
    });
  }
  if (order.appyPayReferenceEntity || order.appyPayReferenceNumber) {
    technicalRows.push({
      key: 'providerReference',
      value: [order.appyPayReferenceEntity, order.appyPayReferenceNumber].filter(Boolean).join(' / '),
    });
  }
  if (order.appyPayReferenceDueDate) {
    technicalRows.push({ key: 'referenceDueDate', value: formatDate(order.appyPayReferenceDueDate, lang) });
  }
  if (order.inventoryReservationExpiresAt) {
    technicalRows.push({ key: 'reservationExpires', value: formatDateTime(order.inventoryReservationExpiresAt, lang) });
  }

  return {
    providerStatus: labelFor(order.appyPayStatus, PROVIDER_STATUS_LABELS[lang]),
    paymentMethod: labelFor(order.appyPayPaymentMethod, PAYMENT_METHOD_LABELS),
    verifiedAt: formatDateTime(order.appyPayVerifiedAt, lang),
    inventoryStatus: labelFor(order.inventoryReservationStatus, INVENTORY_STATUS_LABELS[lang]),
    technicalRows,
  };
}
