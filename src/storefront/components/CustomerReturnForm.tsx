import { useCallback, useEffect, useState } from 'react';
import { C, F } from '../../theme';
import { cancelCustomerReturn, createCustomerReturnSession, submitCustomerReturn, type CustomerReturnSession } from '../../lib/api';

type Props = { orderNumber: string; email: string; lang: 'pt' | 'en'; onSubmitted: () => void };
type Selection = Record<string, { quantity: number; replacementVariantId?: string }>;

export function CustomerReturnForm({ orderNumber, email, lang, onSubmitted }: Props) {
  const pt = lang === 'pt';
  const [session, setSession] = useState<CustomerReturnSession | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Selection>({});
  const [resolution, setResolution] = useState('refund');
  const [reason, setReason] = useState('wrong_size');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<Array<{ filename: string; mimeType: string; data: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const loadSession = useCallback(async () => {
    const next = await createCustomerReturnSession(orderNumber, email);
    setSession(next);
    if (next.market === 'AO') setResolution('exchange');
  }, [orderNumber, email]);

  useEffect(() => {
    let active = true;
    createCustomerReturnSession(orderNumber, email).then((next) => {
      if (!active) return;
      setSession(next);
      if (next.market === 'AO') setResolution('exchange');
    }).catch(() => undefined);
    return () => { active = false; };
  }, [orderNumber, email]);

  const cancelRequest = async (returnNumber: string) => {
    if (!session?.sessionToken) return;
    setBusy(true); setError('');
    try {
      await cancelCustomerReturn({ orderNumber, email, sessionToken: session.sessionToken, returnNumber });
      await loadSession();
      onSubmitted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to cancel request.');
    } finally { setBusy(false); }
  };

  if (!session || (!session.eligible && !session.cancellableReturns?.length)) return null;
  const total = (session.items || []).reduce((sum, item) => sum + (items[item.orderItemId]?.quantity || 0) * item.unitRefundable, 0);

  const submit = async () => {
    const selected = Object.entries(items).filter(([, value]) => value.quantity > 0).map(([orderItemId, value]) => ({ orderItemId, ...value }));
    if (!selected.length) { setError(pt ? 'Selecione pelo menos um artigo.' : 'Select at least one item.'); return; }
    setBusy(true); setError('');
    try {
      const result = await submitCustomerReturn({ orderNumber, email, sessionToken: session.sessionToken!, resolution, reason, customerNote: note, items: selected, evidence: files });
      setDone(result.returnNumber);
      await loadSession();
      onSubmitted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit request.');
    } finally { setBusy(false); }
  };

  return <div style={{ marginTop: 16 }}>
    {session.cancellableReturns?.map((request) => <div key={request.returnNumber} style={{ ...box, marginBottom: 10 }}>
      <b>{pt ? 'Pedido em análise' : 'Request under review'} — {request.returnNumber}</b>
      <button disabled={busy} onClick={() => cancelRequest(request.returnNumber)} style={{ ...secondary, marginTop: 10, display: 'block' }}>
        {pt ? 'Cancelar pedido' : 'Cancel request'}
      </button>
    </div>)}
    {done && <div style={box}><b>{pt ? 'Pedido enviado' : 'Request submitted'} — {done}</b><div style={{ fontSize: 12, color: C.inkSoft, marginTop: 6 }}>{pt ? 'A Use Me irá analisar o pedido antes de aprovar qualquer reembolso ou troca.' : 'Use Me will review it before approving any refund or exchange.'}</div></div>}
    {!done && session.eligible && (!open
      ? <button onClick={() => setOpen(true)} style={primary}>{pt ? 'Pedir troca ou devolução' : 'Request return or exchange'}</button>
      : <div style={box}>
        <h3 style={{ fontFamily: F.display, margin: '0 0 6px' }}>{pt ? 'Pedir troca ou devolução' : 'Request return or exchange'}</h3>
        <p style={{ fontSize: 12, color: C.inkSoft, margin: '0 0 16px' }}>{pt ? 'Este é um pedido sujeito a análise. Nenhum reembolso é automático.' : 'This request is subject to review. No refund is automatic.'}</p>
        {session.items?.map((item) => <div key={item.orderItemId} style={{ padding: '12px 0', borderTop: `1px solid ${C.ruleLight}`, opacity: item.returnEligible && item.availableQuantity ? 1 : .5 }}>
          <b style={{ fontSize: 13 }}>{item.productName}</b>
          <div style={{ fontSize: 11, color: C.inkSoft }}>{[item.color, item.size].filter(Boolean).join(' / ')} · {item.availableQuantity} {pt ? 'disponível' : 'available'}</div>
          {!item.returnEligible && <div style={{ fontSize: 11, color: C.danger }}>{pt ? 'Apenas elegível em caso de defeito ou artigo incorreto.' : 'Only eligible if defective or incorrect.'}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <input aria-label={`Quantity ${item.productName}`} type="number" min="0" max={item.availableQuantity} value={items[item.orderItemId]?.quantity || 0} onChange={(event) => setItems((current) => ({ ...current, [item.orderItemId]: { ...current[item.orderItemId], quantity: Math.min(item.availableQuantity, Number(event.target.value)) } }))} style={{ ...input, width: 80 }} />
            {resolution === 'exchange' && <select aria-label={`Replacement ${item.productName}`} value={items[item.orderItemId]?.replacementVariantId || ''} onChange={(event) => setItems((current) => ({ ...current, [item.orderItemId]: { quantity: current[item.orderItemId]?.quantity || 0, replacementVariantId: event.target.value } }))} style={{ ...input, flex: 1, minWidth: 180 }}><option value="">{pt ? 'Escolher substituição' : 'Choose replacement'}</option>{item.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label || variant.id}</option>)}</select>}
          </div>
        </div>)}
        <div style={grid}>
          <label>{pt ? 'Resolução pretendida' : 'Requested resolution'}<select value={resolution} onChange={(event) => setResolution(event.target.value)} style={input}>{session.market === 'PT' && <option value="refund">{pt ? 'Reembolso' : 'Refund'}</option>}<option value="exchange">{pt ? 'Troca' : 'Exchange'}</option><option value="store_credit">{pt ? 'Crédito em loja' : 'Store credit'}</option>{session.market === 'AO' && ['defective', 'incorrect_item'].includes(reason) && <option value="refund">{pt ? 'Reembolso — sujeito a análise' : 'Refund — review required'}</option>}</select></label>
          <label>{pt ? 'Motivo' : 'Reason'}<select value={reason} onChange={(event) => setReason(event.target.value)} style={input}>{['wrong_size', 'wrong_colour', 'changed_mind', 'defective', 'incorrect_item', 'other'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={pt ? 'Explique brevemente o pedido' : 'Briefly explain your request'} rows={3} style={{ ...input, width: '100%', marginTop: 10 }} />
        <label style={{ display: 'block', fontSize: 11, marginTop: 10 }}>{pt ? 'Fotografias (obrigatórias para defeito/artigo incorreto; máx. 3, 2 MB cada)' : 'Photos (required for defects/wrong items; max 3, 2 MB each)'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (event) => { const selected = [...(event.target.files || [])].slice(0, 3); const converted = []; for (const file of selected) { if (file.size > 2_000_000) { setError(pt ? 'Uma imagem excede 2 MB.' : 'An image exceeds 2 MB.'); return; } converted.push({ filename: file.name, mimeType: file.type, data: (await fileData(file)).split(',')[1] }); } setFiles(converted); }} /></label>
        <div style={{ fontWeight: 800, marginTop: 12 }}>{pt ? 'Valor estimado sujeito a aprovação' : 'Estimated value subject to approval'}: {total.toFixed(2)} {session.currency}</div>
        {error && <div role="alert" style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}><button disabled={busy} onClick={submit} style={primary}>{busy ? '…' : pt ? 'Enviar pedido' : 'Submit request'}</button><button disabled={busy} onClick={() => setOpen(false)} style={secondary}>{pt ? 'Fechar' : 'Close'}</button></div>
      </div>)}
    {!open && error && <div role="alert" style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{error}</div>}
  </div>;
}

const fileData = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
const box = { padding: 16, border: `1px solid ${C.ruleLight}`, borderRadius: 8, background: C.paper } as const;
const primary = { padding: '11px 15px', background: C.black, color: C.onDarkGold, borderRadius: 7, fontWeight: 800 } as const;
const secondary = { padding: '11px 15px', border: `1px solid ${C.rule}`, borderRadius: 7, color: C.ink } as const;
const input = { padding: '9px', border: `1px solid ${C.fieldBorder}`, borderRadius: 6, background: C.paper } as const;
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 14, fontSize: 11 } as const;
