import { useEffect, useMemo, useState } from 'react';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminListMessages, adminSendMessage, adminUpdateMessageStatus, type ApiMessage, type MessageStatus } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, type BadgeTone } from '../components/Badge';
import { t } from '../i18n';

const STATUS_LABEL_KEY: Record<MessageStatus, string> = {
  open: 'msgNeedsReview',
  auto_handled: 'msgAutoHandled',
  escalated: 'msgEscalated',
  resolved: 'msgResolved',
};

const STATUS_TONE: Record<MessageStatus, BadgeTone> = {
  open: 'gold',
  auto_handled: 'green',
  escalated: 'red',
  resolved: 'neutral',
};

type Conversation = {
  key: string;
  channel: ApiMessage['channel'];
  contactHandle: string;
  customerName?: string;
  messages: ApiMessage[];
  lastAt: string;
  status: MessageStatus;
};

function groupIntoConversations(messages: ApiMessage[]): Conversation[] {
  const byKey = new Map<string, ApiMessage[]>();
  for (const m of messages) {
    const key = `${m.channel}:${m.contactHandle}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(m);
  }
  const conversations: Conversation[] = [];
  for (const [key, msgs] of byKey) {
    const sorted = [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const last = sorted[sorted.length - 1];
    conversations.push({
      key,
      channel: last.channel,
      contactHandle: last.contactHandle,
      customerName: sorted.find((m) => m.customerName)?.customerName,
      messages: sorted,
      lastAt: last.createdAt,
      status: last.status,
    });
  }
  return conversations.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
}

// JOS-58 Phase 1 messaging foundation: WhatsApp + Instagram conversation log
// with simple keyword-based automation (see use-me-with-style-cms README /
// src/lib/messaging.ts). Restyled to match the Figma "AI-assisted Messaging"
// visual language (approval-queue framing, Phase 1 badges) while keeping the
// actual conversation-thread UI, since that's the functional core of JOS-58.
export function Mensagens() {
  const { lang } = useApp();
  const [messages, setMessages] = useState<ApiMessage[] | null>(null);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MessageStatus | ''>('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    adminListMessages()
      .then(setMessages)
      .catch(() => setError(true));
  };

  useEffect(load, []);

  const conversations = useMemo(() => (messages ? groupIntoConversations(messages) : []), [messages]);
  const filtered = statusFilter ? conversations.filter((c) => c.status === statusFilter) : conversations;
  const selected = conversations.find((c) => c.key === selectedKey) ?? filtered[0] ?? null;

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await adminSendMessage({ channel: selected.channel, contactHandle: selected.contactHandle, customerName: selected.customerName, body: reply.trim() });
      setReply('');
      load();
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status: MessageStatus) => {
    if (!selected) return;
    const lastMsg = selected.messages[selected.messages.length - 1];
    try {
      await adminUpdateMessageStatus(lastMsg.id, status);
      load();
    } catch {
      setError(true);
    }
  };

  return (
    <div style={{ paddingBottom: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader eyebrow={t('settingsMessaging', lang)} title={t('aiAssistedMessaging', lang)} subtitle={t('aiAssistedMessagingSubtitle', lang)} />

      {error && <div style={{ margin: '12px 28px 0', fontSize: 12, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}

      <div className="ump-mensagens-shell" style={{ margin: '18px 28px 28px', border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden', background: C.paper }}>
        <div className="ump-mensagens-list" style={{ borderRight: `1px solid ${C.ruleLight}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: C.ink }}>{t('approvalQueue', lang)}</div>
            <Badge label={t('requiredBadge', lang)} tone="gold" />
          </div>

          <div style={{ display: 'flex', gap: 5, padding: '0 16px 12px', flexWrap: 'wrap' }}>
            <FilterPill label={t('filterAllShort', lang)} active={!statusFilter} onClick={() => setStatusFilter('')} />
            {(Object.keys(STATUS_LABEL_KEY) as MessageStatus[]).map((s) => (
              <FilterPill key={s} label={t(STATUS_LABEL_KEY[s], lang)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedKey(c.key)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderBottom: `1px solid ${C.ruleLight}`,
                  background: (selected?.key ?? filtered[0]?.key) === c.key ? C.subtleBg : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{c.customerName || c.contactHandle}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: C.inkSoft, textTransform: 'uppercase' }}>{c.channel}</span>
                </div>
                <div style={{ fontSize: 11, color: C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                  {c.messages[c.messages.length - 1].body}
                </div>
                <Badge label={t(STATUS_LABEL_KEY[c.status], lang)} tone={STATUS_TONE[c.status]} />
              </button>
            ))}
            {messages && filtered.length === 0 && <div style={{ padding: 16, fontSize: 12, color: C.inkSoft }}>{t('noConversations', lang)}</div>}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          {!selected && <div style={{ padding: 28, fontSize: 13, color: C.inkSoft }}>{t('selectAConversation', lang)}</div>}

          {selected && (
            <>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: C.ink }}>{selected.customerName || selected.contactHandle}</div>
                  <div style={{ fontSize: 11, color: C.inkSoft }}>
                    {selected.channel} · {selected.contactHandle}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleStatus('escalated')} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: '1px solid #E1B3AA', color: '#B95545' }}>
                    {t('escalateAction', lang)}
                  </button>
                  <button onClick={() => handleStatus('resolved')} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: '1px solid #BFD3B6', color: '#3F754D' }}>
                    {t('markResolved', lang)}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.messages.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: 420,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: m.direction === 'outbound' ? C.black : C.subtleBg,
                        color: m.direction === 'outbound' ? C.onDark : C.ink,
                        border: m.direction === 'inbound' ? `1px solid ${C.ruleLight}` : 'none',
                        fontSize: 13,
                      }}
                    >
                      <div>{m.body}</div>
                      {m.automationNote && (
                        <div style={{ fontSize: 10, color: m.direction === 'outbound' ? C.onDarkGold : C.inkSoft, marginTop: 4 }}>{m.automationNote}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 16, borderTop: `1px solid ${C.ruleLight}`, display: 'flex', gap: 8 }}>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('writeAReply', lang)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  style={{ flex: 1, padding: '10px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper }}
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  style={{ padding: '10px 20px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6 }}
                >
                  {sending ? '…' : t('sendAction', lang)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 11px',
        fontSize: 10,
        fontWeight: 800,
        borderRadius: 6,
        border: `1px solid ${active ? C.black : C.rule}`,
        background: active ? C.black : 'transparent',
        color: active ? C.onDarkGold : C.inkSoft,
      }}
    >
      {label}
    </button>
  );
}
