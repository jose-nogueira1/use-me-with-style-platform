// Marking an order shipped should send the tracking number typed on the order page in
// the same request: the customer then gets ONE shipped email that already carries it.
// (Sent separately, the number would trigger a second email after the first.)

/** Extra fields for the "mark as shipped" request: the typed number, when it is new. */
export function shipmentExtra(savedCode: string | null | undefined, typedCode: string | null | undefined): { cttTrackingCode: string } | undefined {
  const typed = (typedCode ?? '').trim();
  return typed && typed !== (savedCode ?? '').trim() ? { cttTrackingCode: typed } : undefined;
}

/** Angola orders get a tracking number from Zygo; shipping without one means the customer
 * receives a second, short email when it is added later. Portugal's untracked CTT Standard
 * has no number at all, so it is never asked. */
export function shouldConfirmNoTracking(market: string, savedCode: string | null | undefined, typedCode: string | null | undefined): boolean {
  return market === 'AO' && !(savedCode ?? '').trim() && !(typedCode ?? '').trim();
}
