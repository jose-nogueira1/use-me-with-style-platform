type AppyPayStatusResult = {
  paymentStatus: string;
};

type PollOptions<T extends AppyPayStatusResult> = {
  lookup: () => Promise<T>;
  signal?: AbortSignal;
  intervalMs?: number;
  timeoutMs?: number;
  wait?: (milliseconds: number) => Promise<void>;
  now?: () => number;
};

const defaultWait = (milliseconds: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

export async function waitForAppyPayResolution<T extends AppyPayStatusResult>({
  lookup,
  signal,
  intervalMs = 2_000,
  timeoutMs = 20 * 60 * 1_000,
  wait = defaultWait,
  now = Date.now,
}: PollOptions<T>): Promise<T | null> {
  const startedAt = now();
  while (!signal?.aborted && now() - startedAt < timeoutMs) {
    try {
      const order = await lookup();
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'failed') return order;
    } catch (err) {
      console.error('AppyPay payment-status poll failed', err);
    }
    if (signal?.aborted) return null;
    await wait(intervalMs);
  }
  return null;
}
