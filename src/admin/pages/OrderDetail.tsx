import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminCreateReturn, adminGetInvoiceForOrder, adminGetOrder, adminInvoicePdfUrl, adminListReturns, adminUpdateOrder, adminUpdateOrderStatus, type ApiInvoice, type ApiOrder, type ApiReturn } from '../../lib/api';

// Phase 2: switch on only after the return workflow receives its robustness pass.
const RETURNS_PHASE_2_ENABLED = false;
import { PageHeader } from '../components/PageHeader';
import { Badge, orderStatusBadgeProps, statusBadgeProps } from '../components/Badge';
import { useDirty } from '../lib/useDirty';
import { DELIVERY_METHODS, deliveryMethodLabel, paymentMethodLabel } from '../lib/orderLabels';
import { t, type Lang } from '../i18n';

const STATUSES = ['new', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending', 'awaiting_manual_review', 'paid', 'failed'] as const;
const PAYMENT_STATUS_KEY: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  pending: 'payStatusPending',
  awaiting_manual_review: 'payStatusAwaitingReview',
  paid: 'payStatusPaid',
  failed: 'payStatusFailed',
};

// Editable core fields (added 2026-07-25 for storefront-admin/Payload-admin
// parity -- previously only the status pipeline below was editable here,
// everything else required going into Payload admin directly). Deliberately
// excludes items/subtotal/total: see adminUpdateOrder's comment in lib/api.ts
// for why that's left out even though Payload's raw admin technically allows it.
type EditableFields = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  taxId: string;
  notes: string;
  paymentStatus: string;
  deliveryMethod: string;
  cttTrackingCode: string;
};

function toEditable(order: ApiOrder): EditableFields {
  return {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    address: order.address,
    addressLine2: order.addressLine2 ?? '',
    postalCode: order.postalCode ?? '',
    city: order.city,
    country: order.country,
    taxId: order.taxId ?? '',
    notes: order.notes ?? '',
    paymentStatus: order.paymentStatus,
    deliveryMethod: order.deliveryMethod,
    cttTrackingCode: order.cttTrackingCode ?? '',
  };
}

export function OrderDetail() {
  const { lang } = useApp();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [form, setForm] = useState<EditableFields | null>(null);
  // Snapshot of `form` exactly as loaded (or last saved), to disable the
  // fields Save until something actually changed (2026-07-31 admin report)
  // -- see admin/lib/useDirty.ts. Kept in sync everywhere `form` is reset
  // from the server (initial load, a status change, or a successful save),
  // since all three make `form` match what the server now holds.
  const [originalForm, setOriginalForm] = useState<EditableFields | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);
  const isFieldsDirty = useDirty(form, originalForm);
  // The order's invoice, if one's been generated -- see notifyOrderEvent.ts's
  // justPaid branch, which only fires once paymentStatus reaches 'paid'.
  // null is the normal/common state (not-yet-paid orders never get one),
  // not an error. Added 2026-08-01 so the invoice is reachable directly from
  // the order it belongs to, instead of only from the separate Invoices page
  // (which requires cross-referencing the order number by hand).
  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [returns, setReturns] = useState<ApiReturn[]>([]);
  const [creatingReturn, setCreatingReturn] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminGetOrder(id)
      .then((o) => {
        setOrder(o);
        const loaded = toEditable(o);
        setForm(loaded);
        setOriginalForm(loaded);
      })
      .catch(() => setError(true));
    adminGetInvoiceForOrder(id)
      .then(setInvoice)
      .catch(() => {}); // Non-fatal: the order itself already loaded fine above.
    if (RETURNS_PHASE_2_ENABLED) adminListReturns({ order: id }).then(setReturns).catch(() => {});
  }, [id]);

  const handleStatusChange = async (status: string, extra?: Record<string, unknown>) => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await adminUpdateOrderStatus(order.id, status, extra);
      setOrder(updated);
      const loaded = toEditable(updated);
      setForm(loaded);
      setOriginalForm(loaded);
      // A status change that just set paymentStatus: 'paid' (see
      // handleNextStep's 'confirmPayment' step below) may have generated a
      // brand-new invoice in the same request -- notifyOrderEvent.ts's
      // justPaid branch awaits invoice generation before returning, so it's
      // already there by the time this PATCH resolves. Re-fetch so it shows
      // up immediately instead of only after a manual page reload.
      adminGetInvoiceForOrder(order.id).then(setInvoice).catch(() => {});
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  // Bug found during 2026-07-31 QA: the header/bottom "Confirm payment" CTA
  // only ever moved `status` to 'processing' and left `paymentStatus`
  // untouched -- verified against the Payload Local API that this really
  // does leave paymentStatus stuck at 'pending' and the inventory
  // reservation stuck 'active' (never committed), with no error of any
  // kind. Fixed by PATCHing both fields together -- originally as its own
  // handleConfirmPayment, folded into the more general NEXT_STEP map below
  // once a follow-up report showed the button needed to do more than just
  // that one step (see next comment).
  //
  // Follow-up report, same day: "I clicked confirm payment, it moved the
  // order to Processing, however I'm not sure what to do now as there is
  // no button, no nothing." Both CTAs were scoped to ONLY 'new'/
  // 'payment_review' (the earlier fix's own condition, so the button
  // wouldn't do a dead no-op PATCH past that point) -- but nothing replaced
  // it, so the moment an order reached 'processing' its only remaining way
  // forward was clicking directly on a small pill in the status strip
  // above, which doesn't read as "the next thing to do" the way a CTA
  // button does. This generalizes both buttons into a single "what's the
  // next step" action that stays present through the whole pipeline
  // instead of vanishing after the first step: confirm payment, then mark
  // shipped, then mark delivered. Nothing after 'delivered' (or
  // 'cancelled', see handleStatusPillClick below) -- those are endpoints,
  // not steps.
  const NEXT_STEP: Partial<Record<string, { labelKey: string; nextStatus: string; extra?: Record<string, unknown> }>> = {
    new: { labelKey: 'confirmPayment', nextStatus: 'processing', extra: { paymentStatus: 'paid' } },
    payment_review: { labelKey: 'confirmPayment', nextStatus: 'processing', extra: { paymentStatus: 'paid' } },
    processing: { labelKey: 'markAsShipped', nextStatus: 'shipped' },
    shipped: { labelKey: 'markAsDelivered', nextStatus: 'delivered' },
  };
  const nextStep = NEXT_STEP[order?.status ?? ''];
  const handleNextStep = () => {
    if (!nextStep) return;
    handleStatusChange(nextStep.nextStatus, nextStep.extra);
  };

  // Clicking any status pill previously always succeeded, including moving
  // a 'delivered' order back to 'processing' with zero warning (confirmed
  // via QA) -- inventory/notification side effects from the forward
  // transitions are NOT undone by going backward, so this at least makes
  // an admin consciously choose to do it.
  //
  // 'cancelled' itself is excluded from that confirm-and-proceed pattern --
  // it's now a hard stop, not just a speed bump (2026-07-31, found by
  // reviewing a screen recording of manual QA that walked a cancelled order
  // back to 'processing'): manageInventoryReservation has no path back from
  // a 'released' reservation to 'committed'/'active', so a reopened order
  // can end up showing paymentStatus 'paid' / status 'processing' -- a
  // normal-looking live order -- while its stock was already given back to
  // general inventory and never re-reserved. The CMS now rejects this
  // server-side too (Orders.ts), so this UI-side block isn't the only line
  // of defence, but it also means clicking through the old confirm dialog
  // here would now just surface a raw API error -- better to not offer the
  // click at all (the pills below are disabled once status is 'cancelled').
  const handleStatusPillClick = (status: string) => {
    if (!order) return;
    if (order.status === 'cancelled') return;
    if (status === 'cancelled' && order.status !== 'new') return;
    const fromIdx = STATUSES.indexOf(order.status as (typeof STATUSES)[number]);
    const toIdx = STATUSES.indexOf(status as (typeof STATUSES)[number]);
    const isBackward = toIdx < fromIdx || status === 'cancelled';
    if (isBackward && !window.confirm(t('confirmStatusRegression', lang, { status: statusBadgeProps(status, lang).label }))) return;
    handleStatusChange(status);
  };

  const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setFieldsSaved(false);
  };

  const handleSaveFields = async () => {
    if (!order || !form) return;
    setSaving(true);
    setFieldsSaved(false);
    try {
      const updated = await adminUpdateOrder(order.id, {
        ...form,
        addressLine2: form.addressLine2 || undefined,
        postalCode: form.postalCode || undefined,
        taxId: form.taxId || undefined,
        notes: form.notes || undefined,
      });
      setOrder(updated);
      const loaded = toEditable(updated);
      setForm(loaded);
      setOriginalForm(loaded);
      setFieldsSaved(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '32px 28px', fontSize: 13, color: '#B95545' }}>
        {t('couldntLoadOrder', lang)} <Link to="/admin/encomendas">{t('backLink', lang)}</Link>
      </div>
    );
  }

  if (!order || !form) {
    return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>;
  }

  const activeIdx = STATUSES.indexOf(order.status as (typeof STATUSES)[number]);
  const b = orderStatusBadgeProps(order, lang);
  const createReturn = async () => {
    const selected = order.items.map((item, index) => ({ orderItemId: String((item as { id?: string }).id ?? index), quantity: Number(window.prompt(`${item.productName}: quantity to return (0-${item.qty})`, '0') || 0) })).filter((item) => item.quantity > 0);
    if (!selected.length) return;
    const resolution = window.prompt(lang === 'pt' ? 'Resolução: refund, exchange ou store_credit' : 'Resolution: refund, exchange or store_credit', order.market === 'AO' ? 'exchange' : 'refund');
    if (!['refund','exchange','store_credit'].includes(resolution || '')) return;
    setCreatingReturn(true);
    try { const created = await adminCreateReturn({ order: order.id, resolution: resolution as ApiReturn['resolution'], reason: 'other', items: selected }); setReturns((rows) => [created, ...rows]); }
    catch { setError(true); } finally { setCreatingReturn(false); }
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={`${t('navOrders', lang)} / #${order.orderNumber}`}
        title={b.label}
        subtitle={t('orderDetailSubtitle', lang)}
        // Previously this button was ALWAYS visible and, once status was
        // past 'payment_review', its "Update status" label did a same-
        // status no-op PATCH -- a dead action that looked like it should do
        // something (2026-07-31 QA fix). Then, after scoping it to just
        // 'new'/'payment_review', it vanished entirely once an order
        // reached 'processing' with nothing to replace it (2026-07-31
        // follow-up report: "no button, no nothing"). Now tracks the
        // pipeline's actual next step the whole way through -- see
        // NEXT_STEP above.
        cta={nextStep ? t(nextStep.labelKey, lang) : undefined}
        onCta={handleNextStep}
        backTo="/admin/encomendas"
        backLabel={t('backToOrders', lang)}
      />

      <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('orderSummaryLabel', lang)}</div>
          <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 800, color: C.ink }}>#{order.orderNumber} {order.customerName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Packing slip (2026-08-01 request) -- prints just the
              .ump-packing-slip below via the @media print rule in App.tsx's
              global stylesheet (hides everything else on the page), so this
              needs no separate route or PDF generation. */}
          <button
            onClick={() => window.print()}
            style={{ padding: '9px 14px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: `1px solid ${C.rule}`, background: C.paper, color: C.ink }}
          >
            {t('printPackingSlip', lang)}
          </button>
          <Badge label={b.label} tone={b.tone} />
        </div>
      </div>

      <div style={{ padding: '18px 28px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {STATUSES.map((s, i) => {
          const current = i === activeIdx;
          // Locked once the order is cancelled -- see handleStatusPillClick's
          // comment above; this is a terminal state now, both here and
          // server-side.
          const locked = (order.status === 'cancelled' && !current) || (s === 'cancelled' && order.status !== 'new');
          return (
            <button
              key={s}
              disabled={saving || locked}
              onClick={() => handleStatusPillClick(s)}
              style={{
                flex: '1 0 120px',
                textAlign: 'left',
                padding: 14,
                borderRadius: 8,
                background: current ? C.tagBg : C.paper,
                border: `1px solid ${current ? '#E8D28D' : C.ruleLight}`,
                opacity: locked ? 0.5 : 1,
                cursor: locked ? 'default' : 'pointer',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{statusBadgeProps(s, lang).label}</div>
              <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 6 }}>
                {/* A cancelled order shouldn't claim every earlier step was
                    "Done" -- 2026-07-31 QA fix, previously activeIdx=5 (the
                    last status) made every pill before it read "Done" even
                    though cancelling doesn't mean shipped/delivered happened. */}
                {current ? t('currentLabel', lang) : order.status !== 'cancelled' && i < activeIdx ? t('doneLabel', lang) : t('pendingLabel', lang)}
              </div>
            </button>
          );
        })}
      </div>
      {order.status === 'cancelled' && (
        <div style={{ padding: '10px 28px 0', fontSize: 11, color: C.inkSoft }}>{t('cancelledOrderLocked', lang)}</div>
      )}

      <div style={{ padding: '18px 28px 0' }}>
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep }}>{t('customerFulfilmentDetails', lang)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {fieldsSaved && <span style={{ fontSize: 11, color: '#3F754D' }}>{t('savedNotice', lang)}</span>}
              <button
                onClick={handleSaveFields}
                disabled={saving || !isFieldsDirty}
                style={{
                  padding: '8px 16px',
                  background: saving || !isFieldsDirty ? C.disabledBg : C.black,
                  color: saving || !isFieldsDirty ? C.disabledFg : C.onDarkGold,
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 6,
                  cursor: saving || !isFieldsDirty ? 'default' : 'pointer',
                }}
              >
                {saving ? '…' : t('saveChanges', lang)}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <EditField label={t('nameField', lang)} value={form.customerName} onChange={(v) => setField('customerName', v)} />
            <EditField label={t('phoneWhatsappField', lang)} value={form.customerPhone} onChange={(v) => setField('customerPhone', v)} />
            <EditField label={t('emailField', lang)} value={form.customerEmail} onChange={(v) => setField('customerEmail', v)} type="email" />
            <EditField label={t('addressField', lang)} value={form.address} onChange={(v) => setField('address', v)} />
            <EditField label={t('addressLine2Field', lang)} value={form.addressLine2} onChange={(v) => setField('addressLine2', v)} />
            {/* PT-only fields, previously shown (and editable) for every
                order regardless of market (2026-07-31, found via screen
                recording: an Angola order showed an editable "Postal code
                (PT): 45124"). Orders.ts's own field descriptions already say
                these are "not collected for Angola" -- the admin UI just
                never matched that. */}
            {order.market === 'PT' && (
              <>
                <EditField label={t('postalCodePT', lang)} value={form.postalCode} onChange={(v) => setField('postalCode', v)} />
              </>
            )}
            <EditField label={t(order.market === 'AO' ? 'municipalityField' : 'cityField', lang)} value={form.city} onChange={(v) => setField('city', v)} />
            <EditField label={t('countryField', lang)} value={form.country} onChange={(v) => setField('country', v)} />
            <EditField label={t('nifTaxId', lang)} value={form.taxId} onChange={(v) => setField('taxId', v)} />
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('paymentStatusLabel', lang)}</div>
              <select
                value={form.paymentStatus}
                onChange={(e) => setField('paymentStatus', e.target.value)}
                style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(PAYMENT_STATUS_KEY[s], lang)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('deliveryMethodLabel', lang)}</div>
              {/* Was a free-text input (2026-07-31 QA finding): Payload's
                  own select-field validation does reject an invalid value
                  server-side ("The following field is invalid"), so no bad
                  data could actually be saved -- but the input let an admin
                  type anything and only find out it was wrong after
                  clicking Save, with a generic error. A constrained select
                  makes that impossible instead of just safely rejected. */}
              <select
                value={form.deliveryMethod}
                onChange={(e) => setField('deliveryMethod', e.target.value)}
                style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
              >
                {!DELIVERY_METHODS.includes(form.deliveryMethod) && <option value={form.deliveryMethod}>{form.deliveryMethod}</option>}
                {DELIVERY_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {deliveryMethodLabel(m, lang)}
                  </option>
                ))}
              </select>
            </label>
            <EditField label={t('deliveryRegionLabel', lang)} value={order.deliveryRegion ?? ''} onChange={() => {}} disabled />
            {order.market === 'PT' && <EditField label={t('cttTrackingCodeLabel', lang)} value={form.cttTrackingCode} onChange={(v) => setField('cttTrackingCode', v.toUpperCase().replace(/\s/g, ''))} />}
            <label style={{ display: 'block', gridColumn: 'span 3' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('notesLabel', lang)}</div>
              <textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 28px 0', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'flex-start' }} className="ump-admin-orders-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 10 }}>{t('itemsOrdered', lang)}</div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i > 0 ? `1px solid ${C.ruleLight}` : 'none' }}>
              <div style={{ width: 56, height: 68, flexShrink: 0, borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: C.goldDeep, textAlign: 'center' }}>
                {t('photoPending', lang)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{item.productName}</div>
                <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                  {item.productType === 'bundle'
                    ? (lang === 'pt' ? 'Kit de produtos' : 'Product kit')
                    : [item.optionLabel && item.optionValue ? `${item.optionLabel}: ${item.optionValue}` : item.size ? t('sizeWithValue', lang, { size: item.size }) : '', item.color].filter(Boolean).join(', ')}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{t('qtyWithValue', lang, { n: item.qty })}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{item.unitPrice.toLocaleString('en-US')} {order.currency}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 8 }}>{t('paymentAndDelivery', lang)}</div>
          <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 14, lineHeight: 1.3 }}>
            {/* Was keyed off order.status === 'payment_review' (2026-07-31 QA
                fix): that meant an order sitting in 'new' with paymentStatus
                still 'pending' read as "Confirmed" here, and once status
                moved past 'payment_review' this ALWAYS said "Confirmed"
                regardless of whether paymentStatus had actually been set --
                confirmed via QA (TEST 2) that clicking the old CTA left
                paymentStatus at 'pending' while this label already claimed
                confirmed. Now driven by the field that actually tracks it. */}
            {order.paymentStatus === 'paid' ? t('confirmedLabel', lang) : t('manualConfirmationNeeded', lang)}
          </div>
          <RowKV
            label={t('paymentMethodLabel', lang)}
            value={paymentMethodLabel(order.paymentMethod, lang)}
            badge={order.paymentStatus !== 'paid' ? t('reviewBadge', lang) : undefined}
            tone="gold"
          />
          <RowKV label={t('deliveryMethodLabel', lang)} value={deliveryMethodLabel(order.deliveryMethod, lang)} />
          {/* Subtotal/shipping/discount breakdown (2026-07-31, addresses
              "I'm still a bit confused on how it works" -- previously only
              the final total was shown here, with no visibility into how a
              coupon or shipping fee had actually been applied). */}
          <RowKV label={t('subtotalLabel', lang)} value={`${order.subtotal.toLocaleString('en-US')} ${order.currency}`} />
          <RowKV label={t('shippingCostLabel', lang)} value={order.shippingCost > 0 ? `${order.shippingCost.toLocaleString('en-US')} ${order.currency}` : t('freeShippingValue', lang)} />
          {!!order.discountAmount && (
            <RowKV label={t('discountAppliedLabel', lang)} value={`-${order.discountAmount.toLocaleString('en-US')} ${order.currency}${order.discountLabel ? ` · ${order.discountLabel}` : ''}`} />
          )}
          <RowKV label={t('orderTotalLabel', lang)} value={`${order.total.toLocaleString('en-US')} ${order.currency}`} last={!invoice} />
          {/* Invoice, attached directly to the order (2026-08-01 request) --
              previously only reachable from the separate Invoices page,
              cross-referencing the order number by hand. null is the normal
              state for any order that hasn't reached paymentStatus 'paid'
              yet (see notifyOrderEvent.ts) -- nothing renders here until
              then, same as the diagnostics panel below only showing fields
              that actually have a value. */}
          {invoice && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{t('invoiceLabel', lang)}</div>
                <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 3 }}>
                  {invoice.status === 'issued' ? invoice.invoiceNumber : t('invoiceFailedNote', lang)}
                </div>
              </div>
              {invoice.status === 'issued' ? (
                <a
                  href={adminInvoicePdfUrl(invoice.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, fontWeight: 800, color: C.goldDeep, textDecoration: 'underline' }}
                >
                  {t('viewInvoicePdf', lang)}
                </a>
              ) : (
                <Badge label={t('failedBadge', lang)} tone="red" />
              )}
            </div>
          )}
          {/* Tracks the same NEXT_STEP the header CTA does (see above) --
              previously this button was always rendered regardless of
              status and only ever set status='processing' (QA's TEST 4b
              reverted an already-delivered order back to "processing" with
              no warning), then, after that was fixed by scoping it to just
              'new'/'payment_review', it disappeared for good once an order
              passed 'processing' with nothing to replace it ("no button, no
              nothing" -- 2026-07-31 follow-up report). Now stays present
              through the whole pipeline. */}
          {nextStep && (
            <button
              onClick={handleNextStep}
              disabled={saving}
              style={{ width: '100%', marginTop: 14, padding: 12, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6 }}
            >
              {t(nextStep.labelKey, lang)}
            </button>
          )}
        </div>
      </div>

      {RETURNS_PHASE_2_ENABLED && order.paymentStatus === 'paid' && ['processing','shipped','delivered'].includes(order.status) && <div style={{ padding: '18px 28px 0' }}><div style={{ background:C.paper,border:`1px solid ${C.ruleLight}`,borderRadius:8,padding:16 }}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><div style={{fontSize:10,fontWeight:800,color:C.goldDeep}}>{lang==='pt'?'TROCAS E DEVOLUÇÕES':'RETURNS & EXCHANGES'}</div><div style={{fontSize:11,color:C.inkSoft,marginTop:5}}>{lang==='pt'?'A encomenda permanece intacta; cada devolução tem o seu próprio histórico.':'The order remains intact; each return has its own audit history.'}</div></div><button disabled={creatingReturn} onClick={createReturn} style={{padding:'9px 14px',background:C.black,color:C.onDarkGold,borderRadius:6,fontWeight:800}}>{creatingReturn?'…':lang==='pt'?'Criar devolução':'Create return'}</button></div>{returns.map(r=><Link key={r.id} to={`/admin/devolucoes/${r.id}`} style={{display:'flex',justifyContent:'space-between',paddingTop:12,marginTop:12,borderTop:`1px solid ${C.ruleLight}`,color:C.ink}}><span>{r.returnNumber}</span><b>{r.status.replaceAll('_',' ')}</b></Link>)}</div></div>}

      <PaymentDiagnostics order={order} lang={lang} />
      <OrderHistory order={order} lang={lang} />
      <PackingSlip order={order} lang={lang} />
    </div>
  );
}

// Status-change audit trail (2026-08-01 request) -- read-only, populated by
// Orders.ts's beforeChange hook on every status change (create included).
// Only rendered once statusHistory actually has entries -- every order gets
// at least one ('new', on create) once this ships, but orders created
// before it won't have any, same "only show what's actually there" pattern
// PaymentDiagnostics above already uses.
function OrderHistory({ order, lang }: { order: ApiOrder; lang: Lang }) {
  const entries = order.statusHistory ?? [];
  if (entries.length === 0) return null;
  return (
    <div style={{ padding: '18px 28px 0' }}>
      <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 10 }}>{t('statusHistoryLabel', lang)}</div>
        {entries.map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? `1px solid ${C.ruleLight}` : 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{statusBadgeProps(h.status, lang).label}</div>
            <div style={{ fontSize: 10, color: C.inkSoft, textAlign: 'right' }}>
              {new Date(h.changedAt).toLocaleString(lang === 'pt' ? 'pt-PT' : 'en-US')}
              {h.changedBy ? ` · ${h.changedBy === 'system' ? t('systemActor', lang) : h.changedBy}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Packing slip (2026-08-01 request) -- rendered off-screen at all times;
// the @media print rule in App.tsx's global stylesheet hides every OTHER
// element on the page and makes this one visible + full-width only when
// printing, triggered by the button next to the status badge above. No
// separate route, PDF library, or backend call needed -- the order's
// already fully loaded client-side by the time this renders.
function PackingSlip({ order, lang }: { order: ApiOrder; lang: Lang }) {
  return (
    <div className="ump-packing-slip">
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Use Me With Style</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{t('packingSlipTitle', lang)} -- #{order.orderNumber}</div>
      <div style={{ fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 800 }}>{order.customerName}</div>
        <div>{order.address}{order.addressLine2 ? `, ${order.addressLine2}` : ''}</div>
        <div>{order.postalCode ? `${order.postalCode} ` : ''}{order.city}, {order.country}</div>
        <div>{order.customerPhone}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #000', padding: '4px 0' }}>{t('itemsOrdered', lang)}</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #000', padding: '4px 0' }}>{t('packingSlipSizeHeader', lang)}</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #000', padding: '4px 0' }}>{t('packingSlipQtyHeader', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: '6px 0', borderBottom: '1px solid #ddd' }}>{item.productName}</td>
              <td style={{ padding: '6px 0', borderBottom: '1px solid #ddd' }}>{item.productType === 'bundle' ? (lang === 'pt' ? 'Kit' : 'Bundle') : [item.optionValue || item.size, item.color].filter(Boolean).join(', ') || '—'}</td>
              <td style={{ padding: '6px 0', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {order.notes && (
        <div style={{ marginTop: 16, fontSize: 12 }}>
          <strong>{t('notesLabel', lang)}:</strong> {order.notes}
        </div>
      )}
    </div>
  );
}

// Provider/troubleshooting fields (payment reference, AppyPay gateway
// echoes, inventory reservation state) -- all admin-read-only in Payload
// (see Orders.ts), so this panel only displays them, matching what Payload
// admin shows. Only rendered when at least one value is actually present,
// since most orders (non-AppyPay) won't have any of these set.
function PaymentDiagnostics({ order, lang }: { order: ApiOrder; lang: Lang }) {
  const rows: { label: string; value: string }[] = [
    { label: t('diagPaymentReference', lang), value: order.paymentReference ?? '' },
    { label: t('diagMerchantTxId', lang), value: order.appyPayMerchantTransactionId ?? '' },
    { label: t('diagTransactionId', lang), value: order.appyPayTransactionId ?? '' },
    { label: t('diagStatus', lang), value: order.appyPayStatus ?? '' },
    { label: t('diagPaymentMethod', lang), value: order.appyPayPaymentMethod ?? '' },
    { label: t('diagResponse', lang), value: order.appyPayResponseCode ? `${order.appyPayResponseCode} — ${order.appyPayResponseMessage ?? ''}` : '' },
    { label: t('diagReference', lang), value: order.appyPayReferenceEntity ? `${order.appyPayReferenceEntity} / ${order.appyPayReferenceNumber ?? ''}` : '' },
    { label: t('diagReferenceDueDate', lang), value: order.appyPayReferenceDueDate ? new Date(order.appyPayReferenceDueDate).toLocaleDateString() : '' },
    { label: t('diagVerifiedAt', lang), value: order.appyPayVerifiedAt ? new Date(order.appyPayVerifiedAt).toLocaleString() : '' },
    { label: t('diagInventoryReservation', lang), value: order.inventoryReservationStatus ?? '' },
    { label: t('diagReservationExpires', lang), value: order.inventoryReservationExpiresAt ? new Date(order.inventoryReservationExpiresAt).toLocaleString() : '' },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div style={{ padding: '18px 28px 0' }}>
      <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 10 }}>{t('paymentDiagnostics', lang)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="ump-admin-fields-grid">
          {rows.map((r) => (
            <div key={r.label}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.inkSoft, marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, wordBreak: 'break-all' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
      />
    </label>
  );
}

function RowKV({ label, value, badge, tone, last }: { label: string; value: string; badge?: string; tone?: 'gold'; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${C.ruleLight}` }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 3 }}>{value}</div>
      </div>
      {badge && <Badge label={badge} tone={tone ?? 'neutral'} />}
    </div>
  );
}
