import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronDown, ExternalLink, MessageSquareReply, MoreHorizontal, RefreshCw, Search, Send, StickyNote, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminGetInstagramProfile,
  adminListMessages,
  adminMarkInstagramConversationRead,
  adminSendMessage,
  adminUpdateConversationStatus,
  adminUpdateMessageNote,
  type ApiMessage,
  type ConversationStatus,
  type InstagramProfile,
} from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';

type InboxFilter = 'all' | 'inbox' | 'unread' | ConversationStatus;

type Conversation = {
  key: string;
  contactHandle: string;
  customerName?: string;
  messages: ApiMessage[];
  lastAt: string;
  unreadCount: number;
  workflow: ConversationStatus;
};

const FILTERS: InboxFilter[] = ['all', 'inbox', 'unread', 'needs_reply', 'waiting', 'priority', 'done'];
const QUICK_REPLIES = {
  en: [
    'Thanks for your message. We’ll check this and get back to you shortly.',
    'Could you please send us your order number?',
    'Please confirm which market you are shopping in: Angola or Portugal.',
  ],
  pt: [
    'Obrigada pela mensagem. Vamos verificar e responder em breve.',
    'Pode enviar-nos o número da sua encomenda, por favor?',
    'Confirma em que mercado pretende comprar: Angola ou Portugal?',
  ],
};

const WORKFLOW_LABELS: Record<ConversationStatus, { en: string; pt: string }> = {
  needs_reply: { en: 'Needs reply', pt: 'Precisa de resposta' },
  waiting: { en: 'Waiting', pt: 'A aguardar' },
  priority: { en: 'Priority', pt: 'Prioridade' },
  done: { en: 'Done', pt: 'Concluída' },
};

function inferredWorkflow(last: ApiMessage): ConversationStatus {
  if (last.conversationStatus) return last.conversationStatus;
  if (last.status === 'escalated') return 'priority';
  if (last.status === 'resolved') return 'done';
  return last.direction === 'outbound' ? 'waiting' : 'needs_reply';
}

function groupIntoConversations(messages: ApiMessage[]): Conversation[] {
  const outbound = messages.filter((message) => message.channel === 'instagram' && message.direction === 'outbound');
  const visible = messages.filter((message) => {
    if (message.channel !== 'instagram' || message.direction !== 'inbound' || !message.externalId) return true;
    const receivedAt = new Date(message.createdAt).getTime();
    return !outbound.some((sent) => sent.contactHandle !== message.contactHandle
      && sent.body === message.body
      && Math.abs(new Date(sent.createdAt).getTime() - receivedAt) <= 2 * 60 * 1000);
  });
  const grouped = new Map<string, ApiMessage[]>();
  for (const message of visible) {
    const key = `instagram:${message.contactHandle}`;
    grouped.set(key, [...(grouped.get(key) ?? []), message]);
  }
  return [...grouped.entries()].map(([key, rows]) => {
    const sorted = rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const last = sorted[sorted.length - 1];
    return {
      key,
      contactHandle: last.contactHandle,
      customerName: sorted.find((message) => message.customerName)?.customerName,
      messages: sorted,
      lastAt: last.createdAt,
      unreadCount: sorted.filter((message) => message.direction === 'inbound' && !message.adminReadAt).length,
      workflow: inferredWorkflow(last),
    };
  }).sort((a, b) => {
    const attention = (conversation: Conversation) => conversation.workflow === 'priority' ? 3 : conversation.unreadCount > 0 ? 2 : conversation.workflow === 'needs_reply' ? 1 : 0;
    return attention(b) - attention(a) || new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
  });
}

function relativeTime(value: string, lang: 'en' | 'pt') {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat(lang === 'pt' ? 'pt-PT' : 'en', { numeric: 'auto' });
  if (seconds < 60) return formatter.format(-seconds, 'second');
  if (seconds < 3600) return formatter.format(-Math.round(seconds / 60), 'minute');
  if (seconds < 86400) return formatter.format(-Math.round(seconds / 3600), 'hour');
  if (seconds < 604800) return formatter.format(-Math.round(seconds / 86400), 'day');
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short' }).format(new Date(value));
}

export function Mensagens() {
  const { lang } = useApp();
  const [messages, setMessages] = useState<ApiMessage[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, InstagramProfile | null>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [contextOpen, setContextOpen] = useState(false);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const load = (foreground = true) => {
    if (foreground) setRefreshing(true);
    return adminListMessages().then((rows) => {
      setMessages(rows);
      setError(false);
    }).catch(() => setError(true)).finally(() => foreground && setRefreshing(false));
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void load(false); };
    const interval = window.setInterval(refresh, 5_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const conversations = useMemo(() => messages ? groupIntoConversations(messages) : [], [messages]);
  const filtered = conversations.filter((conversation) => {
    if (filter === 'inbox' && conversation.workflow === 'done') return false;
    if (filter === 'unread' && conversation.unreadCount === 0) return false;
    if (!['all', 'inbox', 'unread'].includes(filter) && conversation.workflow !== filter) return false;
    const needle = query.trim().toLocaleLowerCase();
    return !needle || [conversation.customerName, profiles[conversation.contactHandle]?.username, profiles[conversation.contactHandle]?.name, ...conversation.messages.map((message) => message.body)]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(needle));
  });
  const selected = conversations.find((conversation) => conversation.key === selectedKey) ?? filtered[0] ?? null;
  const selectedProfile = selected ? profiles[selected.contactHandle] : null;
  const draft = selected ? drafts[selected.key] ?? '' : '';
  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);

  useEffect(() => {
    const missing = conversations.map((conversation) => conversation.contactHandle)
      .filter((handle, index, handles) => handles.indexOf(handle) === index && !(handle in profiles));
    if (!missing.length) return;
    let active = true;
    Promise.all(missing.map(async (handle) => {
      try { return [handle, await adminGetInstagramProfile(handle)] as const; }
      catch { return [handle, null] as const; }
    })).then((entries) => active && setProfiles((current) => ({ ...current, ...Object.fromEntries(entries) })));
    return () => { active = false; };
  }, [conversations, profiles]);

  useEffect(() => {
    if (!selected?.unreadCount) return;
    let active = true;
    adminMarkInstagramConversationRead(selected.contactHandle).then(({ readAt, updatedIds }) => {
      if (!active) return;
      const updated = new Set(updatedIds);
      setMessages((current) => current?.map((message) => updated.has(message.id) ? { ...message, adminReadAt: readAt } : message) ?? null);
    }).catch(() => setError(true));
    return () => { active = false; };
  }, [selected?.key, selected?.unreadCount, selected?.contactHandle]);

  const updateWorkflow = async (workflow: ConversationStatus) => {
    if (!selected) return;
    const last = selected.messages[selected.messages.length - 1];
    try {
      const updated = await adminUpdateConversationStatus(last.id, workflow);
      setMessages((current) => current?.map((message) => message.id === updated.id ? updated : message) ?? [updated]);
    } catch { setError(true); }
  };

  const handleReply = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const relatedOrder = selected.messages.map((message) => message.relatedOrder).find(Boolean);
      const sent = await adminSendMessage({
        contactHandle: selected.contactHandle,
        customerName: selected.customerName,
        body: draft.trim(),
        relatedOrder: typeof relatedOrder === 'object' ? relatedOrder.id : relatedOrder,
      });
      setMessages((current) => current ? [sent, ...current.filter((message) => message.id !== sent.id)] : [sent]);
      setDrafts((current) => ({ ...current, [selected.key]: '' }));
      setQuickRepliesOpen(false);
    } catch { setError(true); }
    finally { setSending(false); }
  };

  const saveNote = async () => {
    if (!selected) return;
    const first = selected.messages[0];
    const value = noteDrafts[selected.key] ?? first.internalNote ?? '';
    setSavingNote(true);
    try {
      const updated = await adminUpdateMessageNote(first.id, value.trim());
      setMessages((current) => current?.map((message) => message.id === updated.id ? updated : message) ?? [updated]);
    } catch { setError(true); }
    finally { setSavingNote(false); }
  };

  const focusOriginal = (messageId: string) => {
    document.getElementById(`instagram-message-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(messageId);
    window.setTimeout(() => setHighlightedMessageId((current) => current === messageId ? null : current), 1_800);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      <PageHeader eyebrow={t('settingsMessaging', lang)} title={t('instagramInbox', lang)} subtitle={t('instagramInboxSubtitle', lang)} />
      {error && <div role="alert" style={{ margin: '10px 28px 0', fontSize: 12, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}
      <div aria-live="polite" className="ump-sr-only">{unreadTotal} {lang === 'pt' ? 'mensagens não lidas' : 'unread messages'}</div>

      <div className="ump-mensagens-shell" style={{ margin: '16px 28px 28px', border: `1px solid ${C.ruleLight}`, borderRadius: 10, overflow: 'hidden', background: C.paper, minHeight: 580 }}>
        <aside className="ump-mensagens-list" aria-label={lang === 'pt' ? 'Lista de conversas' : 'Conversation list'} style={{ borderRight: `1px solid ${C.ruleLight}`, display: 'flex', flexDirection: 'column', minWidth: 300 }}>
          <div style={{ padding: '15px 15px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 800, color: C.ink }}>{t('conversationInbox', lang)}</div>
            {unreadTotal > 0 && <span style={{ minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, display: 'grid', placeItems: 'center', background: C.black, color: C.onDarkGold, fontSize: 10, fontWeight: 900 }}>{unreadTotal}</span>}
          </div>
          <div style={{ display: 'flex', gap: 7, padding: '0 15px 10px' }}>
            <label style={{ flex: 1, position: 'relative' }}>
              <Search size={13} aria-hidden style={{ position: 'absolute', left: 9, top: 9, color: C.inkSoft }} />
              <input aria-label={t('searchMessages', lang)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchMessages', lang)} style={{ width: '100%', padding: '7px 9px 7px 29px', fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 7, background: C.paper }} />
            </label>
            <button aria-label={t('refreshMessages', lang)} onClick={() => void load()} disabled={refreshing} style={{ width: 34, minHeight: 34, border: `1px solid ${C.rule}`, borderRadius: 7, color: C.inkSoft, display: 'grid', placeItems: 'center' }}><RefreshCw size={13} style={{ opacity: refreshing ? 0.4 : 1 }} /></button>
          </div>
          <div style={{ display: 'flex', gap: 5, padding: '0 15px 12px', overflowX: 'auto' }}>
            {FILTERS.map((item) => <FilterPill key={item} label={filterLabel(item, lang)} active={filter === item} onClick={() => setFilter(item)} />)}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((conversation) => {
              const profile = profiles[conversation.contactHandle];
              const latest = conversation.messages[conversation.messages.length - 1];
              const unread = conversation.unreadCount > 0;
              return (
                <button key={conversation.key} onClick={() => setSelectedKey(conversation.key)} aria-current={selected?.key === conversation.key ? 'true' : undefined} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', minHeight: 76, borderBottom: `1px solid ${C.ruleLight}`, borderLeft: selected?.key === conversation.key ? `3px solid ${C.gold}` : '3px solid transparent', background: selected?.key === conversation.key ? '#FBF8F1' : 'transparent' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <ProfileAvatar profile={profile} fallback={conversation.customerName || conversation.contactHandle} size={38} />
                      {unread && <span aria-label={lang === 'pt' ? 'Não lida' : 'Unread'} style={{ position: 'absolute', right: -1, top: -1, width: 10, height: 10, borderRadius: '50%', background: C.goldDeep, border: `2px solid ${C.paper}` }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                        <strong style={{ fontSize: 12, fontWeight: unread ? 900 : 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name || conversation.customerName || profile?.username || conversation.contactHandle}</strong>
                        <time dateTime={conversation.lastAt} title={new Date(conversation.lastAt).toLocaleString()} style={{ fontSize: 9, fontWeight: unread ? 900 : 600, color: unread ? C.goldDeep : C.inkSoft, flexShrink: 0 }}>{relativeTime(conversation.lastAt, lang)}</time>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: unread ? 750 : 500, color: unread ? C.ink : C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latest.direction === 'outbound' ? (lang === 'pt' ? 'Tu: ' : 'You: ') : ''}{latest.body}</span>
                        {unread && conversation.unreadCount > 1 && <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: C.goldDeep, color: '#fff', fontSize: 9, fontWeight: 900, display: 'grid', placeItems: 'center' }}>{conversation.unreadCount}</span>}
                      </div>
                      <WorkflowMark status={conversation.workflow} lang={lang} />
                    </div>
                  </div>
                </button>
              );
            })}
            {messages && filtered.length === 0 && <div style={{ padding: 18, fontSize: 12, color: C.inkSoft }}>{t('noConversations', lang)}</div>}
          </div>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 520 }}>
          {!selected && <div style={{ padding: 28, fontSize: 13, color: C.inkSoft }}>{t('selectAConversation', lang)}</div>}
          {selected && <>
            <ConversationHeader conversation={selected} profile={selectedProfile} lang={lang} contextOpen={contextOpen} setContextOpen={setContextOpen} updateWorkflow={updateWorkflow} />
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
                  {selected.messages.map((message, index) => {
                    const previous = selected.messages[index - 1];
                    const next = selected.messages[index + 1];
                    const groupStart = !previous || previous.direction !== message.direction || new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > 5 * 60 * 1000;
                    const groupEnd = !next || next.direction !== message.direction || new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() > 5 * 60 * 1000;
                    const repliedTo = message.replyToExternalId ? selected.messages.find((candidate) => candidate.externalId === message.replyToExternalId) : undefined;
                    return <MessageBubble key={message.id} message={message} repliedTo={repliedTo} lang={lang} groupStart={groupStart} groupEnd={groupEnd} highlighted={highlightedMessageId === message.id} onFocusOriginal={repliedTo ? () => focusOriginal(repliedTo.id) : undefined} />;
                  })}
                </div>
                <Composer lang={lang} draft={draft} setDraft={(value) => setDrafts((current) => ({ ...current, [selected.key]: value }))} sending={sending} send={handleReply} quickRepliesOpen={quickRepliesOpen} setQuickRepliesOpen={setQuickRepliesOpen} />
              </div>
              {contextOpen && <CustomerContext conversation={selected} profile={selectedProfile} lang={lang} noteDraft={noteDrafts[selected.key] ?? selected.messages[0]?.internalNote ?? ''} setNoteDraft={(value) => setNoteDrafts((current) => ({ ...current, [selected.key]: value }))} saveNote={saveNote} savingNote={savingNote} />}
            </div>
          </>}
        </main>
      </div>
    </div>
  );
}

function ConversationHeader({ conversation, profile, lang, contextOpen, setContextOpen, updateWorkflow }: { conversation: Conversation; profile?: InstagramProfile | null; lang: 'en' | 'pt'; contextOpen: boolean; setContextOpen: (open: boolean) => void; updateWorkflow: (status: ConversationStatus) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header style={{ padding: '12px 16px', borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <ProfileAvatar profile={profile} fallback={conversation.customerName || conversation.contactHandle} size={40} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 850, color: C.ink, display: 'flex', alignItems: 'center', gap: 5 }}>{profile?.name || conversation.customerName || profile?.username || conversation.contactHandle}{profile?.is_verified_user && <BadgeCheck size={14} fill="#3B82F6" color="#fff" aria-label="Verified" />}</div>
        <div style={{ fontSize: 10, color: C.inkSoft }}>{profile?.username ? `@${profile.username}` : 'Instagram'}</div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <button onClick={() => void updateWorkflow('needs_reply')} style={headerAction(conversation.workflow === 'needs_reply')}>{lang === 'pt' ? 'Precisa de resposta' : 'Needs reply'}</button>
      <button onClick={() => void updateWorkflow('priority')} style={{ ...headerAction(conversation.workflow === 'priority'), color: conversation.workflow === 'priority' ? C.onDarkGold : '#B95545' }}>{lang === 'pt' ? 'Prioridade' : 'Priority'}</button>
      <button onClick={() => void updateWorkflow('done')} style={headerAction(conversation.workflow === 'done')}>{lang === 'pt' ? 'Concluir' : 'Done'}</button>
      <button aria-expanded={contextOpen} onClick={() => setContextOpen(!contextOpen)} style={{ ...headerAction(contextOpen), display: 'inline-flex', alignItems: 'center', gap: 4 }}><UserRound size={12} /> {lang === 'pt' ? 'Contexto' : 'Context'}</button>
      <a href="https://www.instagram.com/direct/inbox/" target="_blank" rel="noreferrer" aria-label={lang === 'pt' ? 'Abrir conversa no Instagram' : 'Open conversation in Instagram'} style={{ ...headerAction(false), display: 'grid', placeItems: 'center', width: 34, padding: 0 }}><ExternalLink size={13} /></a>
      <div style={{ position: 'relative' }}>
        <button aria-label={lang === 'pt' ? 'Mais ações' : 'More actions'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} style={{ ...headerAction(menuOpen), width: 34, padding: 0 }}><MoreHorizontal size={14} /></button>
        {menuOpen && <div role="menu" style={{ position: 'absolute', right: 0, top: 39, zIndex: 8, width: 190, padding: 5, border: `1px solid ${C.rule}`, borderRadius: 8, background: C.paper, boxShadow: '0 10px 28px rgba(0,0,0,0.14)' }}>
          <button role="menuitem" onClick={() => { setContextOpen(!contextOpen); setMenuOpen(false); }} style={menuItemStyle()}>{contextOpen ? (lang === 'pt' ? 'Fechar contexto' : 'Hide customer context') : (lang === 'pt' ? 'Ver contexto do cliente' : 'View customer context')}</button>
          <button role="menuitem" onClick={() => { void updateWorkflow('needs_reply'); setMenuOpen(false); }} style={menuItemStyle()}>{lang === 'pt' ? 'Marcar como precisa de resposta' : 'Mark as needs reply'}</button>
          <a role="menuitem" href="https://www.instagram.com/direct/inbox/" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)} style={{ ...menuItemStyle(), display: 'block', textDecoration: 'none' }}>{lang === 'pt' ? 'Abrir no Instagram' : 'Open in Instagram'}</a>
        </div>}
      </div>
    </div>
  </header>;
}

function Composer({ lang, draft, setDraft, sending, send, quickRepliesOpen, setQuickRepliesOpen }: { lang: 'en' | 'pt'; draft: string; setDraft: (value: string) => void; sending: boolean; send: () => void; quickRepliesOpen: boolean; setQuickRepliesOpen: (open: boolean) => void }) {
  return <div style={{ position: 'relative', padding: '12px 16px', borderTop: `1px solid ${C.ruleLight}`, background: C.paper }}>
    {quickRepliesOpen && <div style={{ position: 'absolute', left: 16, bottom: 'calc(100% - 4px)', width: 360, maxWidth: 'calc(100% - 32px)', padding: 6, border: `1px solid ${C.rule}`, borderRadius: 8, background: C.paper, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 5 }}>
      {QUICK_REPLIES[lang].map((reply) => <button key={reply} onClick={() => { setDraft(reply); setQuickRepliesOpen(false); }} style={{ width: '100%', padding: '9px 10px', textAlign: 'left', borderRadius: 6, fontSize: 11, color: C.ink }}>{reply}</button>)}
    </div>}
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <button onClick={() => setQuickRepliesOpen(!quickRepliesOpen)} aria-expanded={quickRepliesOpen} style={{ minWidth: 38, height: 38, border: `1px solid ${C.rule}`, borderRadius: 7, display: 'grid', placeItems: 'center', color: C.inkSoft }} title={lang === 'pt' ? 'Respostas guardadas' : 'Saved replies'}><ChevronDown size={14} /></button>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t('writeAReply', lang)} rows={2} maxLength={1000} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 130, padding: '10px 11px', fontSize: 13, lineHeight: 1.45, border: `1px solid ${C.rule}`, borderRadius: 7, background: C.paper }} />
      <button onClick={send} disabled={sending || !draft.trim()} aria-label={t('sendAction', lang)} style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', background: C.black, color: C.onDarkGold, borderRadius: 7 }}><Send size={15} /></button>
    </div>
    <div style={{ minHeight: 16, marginTop: 5, display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 9, color: C.inkSoft }}>
      <span>{lang === 'pt' ? 'Enter para enviar · Shift+Enter para nova linha' : 'Enter to send · Shift+Enter for a new line'}</span>
      <span>{draft.length >= 850 ? `${draft.length}/1000` : ''}</span>
    </div>
  </div>;
}

function CustomerContext({ conversation, profile, lang, noteDraft, setNoteDraft, saveNote, savingNote }: { conversation: Conversation; profile?: InstagramProfile | null; lang: 'en' | 'pt'; noteDraft: string; setNoteDraft: (value: string) => void; saveNote: () => void; savingNote: boolean }) {
  const order = conversation.messages.map((message) => message.relatedOrder).find((value) => Boolean(value) && typeof value === 'object');
  const customer = conversation.messages.map((message) => message.relatedCustomer).find((value) => Boolean(value) && typeof value === 'object');
  return <aside className="ump-mensagens-context" aria-label={lang === 'pt' ? 'Contexto do cliente' : 'Customer context'} style={{ width: 270, flex: '0 0 270px', padding: 14, borderLeft: `1px solid ${C.ruleLight}`, background: '#FCFAF5', overflowY: 'auto' }}>
    <h3 style={{ margin: '0 0 12px', fontFamily: F.display, fontSize: 15, color: C.ink }}>{lang === 'pt' ? 'Contexto do cliente' : 'Customer context'}</h3>
    <ContextSection title={lang === 'pt' ? 'Instagram' : 'Instagram'}>
      <div>{profile?.name || conversation.customerName || '—'}</div>
      <div style={{ color: C.inkSoft }}>{profile?.username ? `@${profile.username}` : conversation.contactHandle}</div>
      {profile?.username && <a href={`https://www.instagram.com/${encodeURIComponent(profile.username)}/`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: 4, marginTop: 7, color: C.ink, fontWeight: 800 }}><ExternalLink size={11} /> {lang === 'pt' ? 'Abrir perfil' : 'Open profile'}</a>}
    </ContextSection>
    <ContextSection title={lang === 'pt' ? 'Mercado' : 'Market'}>
      <strong>{typeof order === 'object' ? (order.market === 'AO' ? 'Angola' : 'Portugal') : (lang === 'pt' ? 'Ainda não estabelecido' : 'Not established yet')}</strong>
      <div style={{ marginTop: 4, color: C.inkSoft }}>{typeof order === 'object' ? (lang === 'pt' ? 'Confirmado pela encomenda associada.' : 'Confirmed by the linked order.') : (lang === 'pt' ? 'Não inferimos pelo perfil ou idioma.' : 'Never inferred from profile or language.')}</div>
    </ContextSection>
    <ContextSection title={lang === 'pt' ? 'Encomenda associada' : 'Linked order'}>
      {typeof order === 'object' ? <Link to={`/admin/encomendas/${order.id}`} style={{ color: C.ink, fontWeight: 850, textDecoration: 'underline' }}>#{order.orderNumber} · {order.status}</Link> : <span style={{ color: C.inkSoft }}>{lang === 'pt' ? 'Nenhuma encomenda associada.' : 'No linked order.'}</span>}
    </ContextSection>
    {typeof customer === 'object' && <ContextSection title={lang === 'pt' ? 'Contacto' : 'Contact'}><div>{customer.email}</div>{customer.phone && <div>{customer.phone}</div>}</ContextSection>}
    <ContextSection title={lang === 'pt' ? 'Nota interna' : 'Internal note'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7, color: C.inkSoft }}><StickyNote size={12} /> {lang === 'pt' ? 'Nunca enviada ao Instagram' : 'Never sent to Instagram'}</div>
      <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={4} maxLength={500} placeholder={lang === 'pt' ? 'Ex.: aguarda confirmação de stock' : 'E.g. waiting for stock confirmation'} style={{ width: '100%', padding: 8, resize: 'vertical', border: `1px solid ${C.rule}`, borderRadius: 6, fontSize: 11, background: C.paper }} />
      <button onClick={saveNote} disabled={savingNote} style={{ marginTop: 7, padding: '7px 10px', borderRadius: 6, background: C.black, color: C.onDarkGold, fontSize: 10, fontWeight: 850 }}>{savingNote ? '…' : lang === 'pt' ? 'Guardar nota' : 'Save note'}</button>
    </ContextSection>
  </aside>;
}

function ContextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ padding: '11px 0', borderTop: `1px solid ${C.ruleLight}`, fontSize: 11, lineHeight: 1.45 }}><div style={{ marginBottom: 6, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.goldDeep }}>{title}</div>{children}</section>;
}

function MessageBubble({ message, repliedTo, lang, groupStart, groupEnd, highlighted, onFocusOriginal }: { message: ApiMessage; repliedTo?: ApiMessage; lang: 'en' | 'pt'; groupStart: boolean; groupEnd: boolean; highlighted: boolean; onFocusOriginal?: () => void }) {
  const outbound = message.direction === 'outbound';
  return <div id={`instagram-message-${message.id}`} style={{ display: 'flex', justifyContent: outbound ? 'flex-end' : 'flex-start', marginTop: groupStart ? 10 : 3, borderRadius: 12, outline: highlighted ? `2px solid ${C.gold}` : '2px solid transparent', outlineOffset: 3, transition: 'outline-color 180ms ease' }}>
    <div style={{ maxWidth: 430, padding: '9px 12px', borderRadius: outbound ? '12px 12px 3px 12px' : '12px 12px 12px 3px', background: outbound ? C.black : '#F4F0E8', color: outbound ? C.onDark : C.ink, border: outbound ? 'none' : `1px solid ${C.ruleLight}`, fontSize: 13, lineHeight: 1.4 }}>
      {message.instagramContextType === 'inline_reply' && <InlineReplyQuote message={message} repliedTo={repliedTo} lang={lang} onFocusOriginal={onFocusOriginal} />}
      <InstagramContextCard message={message} lang={lang} />
      <div>{message.body}</div>
      {message.automationNote === 'instagram-app -- synced outbound echo' && <div style={{ marginTop: 4, fontSize: 9, color: C.onDarkGold }}>{lang === 'pt' ? 'Enviada pelo Instagram' : 'Sent from Instagram'}</div>}
      {groupEnd && <div style={{ marginTop: 5, display: 'flex', justifyContent: 'flex-end', gap: 5, fontSize: 8.5, opacity: 0.68 }}><time dateTime={message.createdAt}>{new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(message.createdAt))}</time>{outbound && <span>· {message.instagramSeenAt ? (lang === 'pt' ? 'Vista' : 'Seen') : (lang === 'pt' ? 'Enviada' : 'Sent')}</span>}</div>}
    </div>
  </div>;
}

function InstagramContextCard({ message, lang }: { message: ApiMessage; lang: 'pt' | 'en' }) {
  const [attempt, setAttempt] = useState<'image' | 'video' | 'failed'>('image');
  if (!message.instagramContextType || message.instagramContextType === 'inline_reply') return null;
  const labels = { story_reply: lang === 'pt' ? 'Resposta ao teu story' : 'Reply to your story', shared_post: lang === 'pt' ? 'Publicação partilhada' : 'Shared Instagram post', media: lang === 'pt' ? 'Conteúdo enviado' : 'Sent media', unsupported_media: lang === 'pt' ? 'Conteúdo no Instagram' : 'Content on Instagram' } as const;
  const label = labels[message.instagramContextType as keyof typeof labels];
  const video = ['reel', 'ig_reel', 'video', 'story_video'].includes(message.instagramContextMediaType ?? '') || /\.(mp4|mov|webm)(?:\?|$)/i.test(message.instagramContextUrl ?? '') || attempt === 'video';
  const hasPreview = Boolean(message.instagramContextUrl) && attempt !== 'failed';
  const error = () => setAttempt(video ? 'failed' : 'video');
  return <div style={{ width: 250, maxWidth: '100%', marginBottom: 7, overflow: 'hidden', borderRadius: 7, border: '1px solid rgba(183,146,75,0.32)', background: message.direction === 'outbound' ? 'rgba(255,255,255,0.08)' : '#fff' }}>
    {hasPreview && !video && <img src={message.instagramContextUrl} alt={label} referrerPolicy="no-referrer" onError={error} style={{ width: '100%', maxHeight: 190, display: 'block', objectFit: 'cover' }} />}
    {hasPreview && video && <video src={message.instagramContextUrl} controls preload="metadata" onError={error} style={{ width: '100%', maxHeight: 200, display: 'block', background: '#000' }} />}
    <div style={{ padding: '7px 9px', fontSize: 9.5, fontWeight: 850 }}>{label}{!hasPreview && <div style={{ marginTop: 3, fontWeight: 500, opacity: 0.72 }}>{lang === 'pt' ? 'Pré-visualização indisponível.' : 'Preview unavailable.'}</div>}{message.instagramContextPermalink && <a href={message.instagramContextPermalink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: 4, marginTop: 5, color: 'inherit', textDecoration: 'underline' }}><ExternalLink size={10} /> Instagram</a>}</div>
  </div>;
}

function InlineReplyQuote({ message, repliedTo, lang, onFocusOriginal }: { message: ApiMessage; repliedTo?: ApiMessage; lang: 'pt' | 'en'; onFocusOriginal?: () => void }) {
  const label = message.direction === 'inbound' ? (lang === 'pt' ? 'Em resposta à tua mensagem' : 'Replying to your message') : (lang === 'pt' ? 'Em resposta ao cliente' : 'Replying to customer');
  const quote = repliedTo?.body || message.replyToText || (lang === 'pt' ? 'Mensagem original indisponível' : 'Original message unavailable');
  const content = <><MessageSquareReply size={10} /><span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 9 }}>{label}</strong><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10.5, opacity: 0.82 }}>{quote}</span></span></>;
  const style = { width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 7px', marginBottom: 7, border: 0, borderLeft: `3px solid ${C.gold}`, borderRadius: 5, background: message.direction === 'outbound' ? 'rgba(255,255,255,0.1)' : 'rgba(183,146,75,0.1)', color: 'inherit', textAlign: 'left' as const };
  return onFocusOriginal ? <button type="button" onClick={onFocusOriginal} style={{ ...style, cursor: 'pointer' }}>{content}</button> : <div style={style}>{content}</div>;
}

function ProfileAvatar({ profile, fallback, size }: { profile?: InstagramProfile | null; fallback: string; size: number }) {
  if (profile?.profile_pic) return <img src={profile.profile_pic} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: '0 0 auto', border: `1px solid ${C.ruleLight}` }} />;
  return <div aria-hidden style={{ width: size, height: size, borderRadius: '50%', flex: '0 0 auto', display: 'grid', placeItems: 'center', background: C.black, color: C.onDarkGold, fontSize: Math.max(11, size * 0.32), fontWeight: 850 }}>{fallback.slice(0, 1).toUpperCase()}</div>;
}

function WorkflowMark({ status, lang }: { status: ConversationStatus; lang: 'en' | 'pt' }) {
  const color = status === 'priority' ? '#B95545' : status === 'needs_reply' ? C.goldDeep : status === 'waiting' ? '#55708D' : C.inkSoft;
  return <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 8.5, fontWeight: 800, color }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />{WORKFLOW_LABELS[status][lang]}</div>;
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} aria-pressed={active} style={{ whiteSpace: 'nowrap', minHeight: 30, padding: '5px 10px', fontSize: 9.5, fontWeight: 850, borderRadius: 15, border: `1px solid ${active ? C.black : C.rule}`, background: active ? C.black : 'transparent', color: active ? C.onDarkGold : C.inkSoft }}>{label}</button>;
}

function filterLabel(filter: InboxFilter, lang: 'en' | 'pt') {
  if (filter === 'all') return lang === 'pt' ? 'Todas' : 'All conversations';
  if (filter === 'inbox') return lang === 'pt' ? 'Caixa de entrada' : 'Inbox';
  if (filter === 'unread') return lang === 'pt' ? 'Não lidas' : 'Unread';
  return WORKFLOW_LABELS[filter][lang];
}

function menuItemStyle(): React.CSSProperties {
  return { width: '100%', minHeight: 36, padding: '8px 9px', borderRadius: 6, color: C.ink, fontSize: 10.5, fontWeight: 750, textAlign: 'left', background: 'transparent' };
}

function headerAction(active: boolean): React.CSSProperties {
  return { minHeight: 34, padding: '0 10px', borderRadius: 7, border: `1px solid ${active ? C.black : C.rule}`, background: active ? C.black : C.paper, color: active ? C.onDarkGold : C.ink, fontSize: 9.5, fontWeight: 850 };
}
