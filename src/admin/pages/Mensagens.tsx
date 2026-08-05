import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ExternalLink, RefreshCw, Search, StickyNote } from 'lucide-react';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminGetInstagramProfile,
  adminListMessages,
  adminSendMessage,
  adminUpdateMessageNote,
  adminUpdateMessageStatus,
  type ApiMessage,
  type InstagramProfile,
  type MessageStatus,
} from '../../lib/api';
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
  // Older webhook handling stored Meta's outbound echoes as inbound messages
  // under the business account's own ID. Keep the source records intact, but
  // hide an echo when it matches an outbound admin message sent moments
  // earlier. New echoes are rejected by the CMS before persistence.
  const outbound = messages.filter((message) => message.channel === 'instagram' && message.direction === 'outbound');
  const visibleMessages = messages.filter((message) => {
    if (message.channel !== 'instagram' || message.direction !== 'inbound' || !message.externalId) return true;
    const receivedAt = new Date(message.createdAt).getTime();
    return !outbound.some((sent) => (
      sent.contactHandle !== message.contactHandle
      && sent.body === message.body
      && Math.abs(new Date(sent.createdAt).getTime() - receivedAt) <= 2 * 60 * 1000
    ));
  });

  const byKey = new Map<string, ApiMessage[]>();
  for (const m of visibleMessages) {
    if (m.channel !== 'instagram') continue;
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

// Instagram-only Phase 1 inbox. WhatsApp remains dormant in the backend so it
// can be restored later, but it is deliberately absent from this interface.
// AI-assisted sales replies are a future feature and are not implied here.
export function Mensagens() {
  const { lang } = useApp();
  const [messages, setMessages] = useState<ApiMessage[] | null>(null);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MessageStatus | ''>('');
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, InstagramProfile | null>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState(false);

  const [refreshing, setRefreshing] = useState(true);

  const load = () => {
    setRefreshing(true);
    adminListMessages()
      .then((rows) => {
        setMessages(rows);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    let active = true;
    adminListMessages()
      .then((rows) => {
        if (!active) return;
        setMessages(rows);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshInBackground = () => {
      adminListMessages()
        .then((rows) => {
          if (!active) return;
          setMessages(rows);
          setError(false);
        })
        .catch(() => {
          if (active) setError(true);
        });
    };
    const intervalId = window.setInterval(refreshInBackground, 5_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshInBackground();
    };
    window.addEventListener('focus', refreshInBackground);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshInBackground);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const conversations = useMemo(() => (messages ? groupIntoConversations(messages) : []), [messages]);
  const filtered = conversations.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return true;
    return [c.customerName, c.contactHandle, ...c.messages.map((m) => m.body)]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase().includes(needle));
  });
  const selected = conversations.find((c) => c.key === selectedKey) ?? filtered[0] ?? null;
  const selectedProfile = selected ? profiles[selected.contactHandle] : null;
  const selectedNoteDraft = selected
    ? (noteDrafts[selected.key] ?? selected.messages[0]?.internalNote ?? '')
    : '';

  useEffect(() => {
    const missingHandles = conversations
      .map((conversation) => conversation.contactHandle)
      .filter((handle, index, handles) => handles.indexOf(handle) === index && !(handle in profiles));
    if (missingHandles.length === 0) return;
    let active = true;
    Promise.all(missingHandles.map(async (handle) => {
      try {
        return [handle, await adminGetInstagramProfile(handle)] as const;
      } catch {
        return [handle, null] as const;
      }
    })).then((entries) => {
      if (active) setProfiles((current) => ({ ...current, ...Object.fromEntries(entries) }));
    });
    return () => { active = false; };
  }, [conversations, profiles]);

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const sentMessage = await adminSendMessage({ contactHandle: selected.contactHandle, customerName: selected.customerName, body: reply.trim() });
      setMessages((current) => current
        ? [sentMessage, ...current.filter((message) => message.id !== sentMessage.id)]
        : [sentMessage]);
      setReply('');
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

  const handleNoteSave = async () => {
    if (!selected) return;
    const noteMessage = selected.messages[0];
    setSavingNote(true);
    try {
      const savedNote = selectedNoteDraft.trim();
      const updated = await adminUpdateMessageNote(noteMessage.id, savedNote);
      setMessages((current) => current?.map((message) => message.id === updated.id ? updated : message) ?? [updated]);
      setNoteDrafts((current) => ({ ...current, [selected.key]: savedNote }));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div style={{ paddingBottom: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader eyebrow={t('settingsMessaging', lang)} title={t('instagramInbox', lang)} subtitle={t('instagramInboxSubtitle', lang)} />

      {error && <div style={{ margin: '12px 28px 0', fontSize: 12, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}

      <div className="ump-mensagens-shell" style={{ margin: '18px 28px 28px', border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden', background: C.paper }}>
        <div className="ump-mensagens-list" style={{ borderRight: `1px solid ${C.ruleLight}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: C.ink }}>{t('conversationInbox', lang)}</div>
            <Badge label="Instagram" tone="blue" />
          </div>

          <div style={{ display: 'flex', gap: 7, padding: '0 16px 10px' }}>
            <label style={{ flex: 1, position: 'relative' }}>
              <Search size={13} aria-hidden style={{ position: 'absolute', left: 9, top: 9, color: C.inkSoft }} />
              <input
                aria-label={t('searchMessages', lang)}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchMessages', lang)}
                style={{ width: '100%', padding: '7px 9px 7px 29px', fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper }}
              />
            </label>
            <button
              aria-label={t('refreshMessages', lang)}
              title={t('refreshMessages', lang)}
              onClick={load}
              disabled={refreshing}
              style={{ width: 32, border: `1px solid ${C.rule}`, borderRadius: 6, color: C.inkSoft, display: 'grid', placeItems: 'center' }}
            >
              <RefreshCw size={13} style={{ opacity: refreshing ? 0.45 : 1 }} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 5, padding: '0 16px 12px', flexWrap: 'wrap' }}>
            <FilterPill label={t('filterAllShort', lang)} active={!statusFilter} onClick={() => setStatusFilter('')} />
            {(Object.keys(STATUS_LABEL_KEY) as MessageStatus[]).map((s) => (
              <FilterPill key={s} label={t(STATUS_LABEL_KEY[s], lang)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((c) => (
              (() => {
                const profile = profiles[c.contactHandle];
                return (
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
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <ProfileAvatar profile={profile} fallback={c.customerName || c.contactHandle} size={34} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile?.name || c.customerName || profile?.username || c.contactHandle}
                  </span>
                  <time dateTime={c.lastAt} style={{ fontSize: 9, fontWeight: 700, color: C.inkSoft }}>
                    {new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(c.lastAt))}
                  </time>
                </div>
                {profile?.username && <div style={{ fontSize: 10, color: C.inkSoft, marginBottom: 4 }}>@{profile.username}</div>}
                <div style={{ fontSize: 11, color: C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                  {c.messages[c.messages.length - 1].body}
                </div>
                <Badge label={t(STATUS_LABEL_KEY[c.status], lang)} tone={STATUS_TONE[c.status]} />
                  </div>
                </div>
              </button>
                );
              })()
            ))}
            {messages && filtered.length === 0 && <div style={{ padding: 16, fontSize: 12, color: C.inkSoft }}>{t('noConversations', lang)}</div>}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          {!selected && <div style={{ padding: 28, fontSize: 13, color: C.inkSoft }}>{t('selectAConversation', lang)}</div>}

          {selected && (
            <>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <ProfileAvatar profile={selectedProfile} fallback={selected.customerName || selected.contactHandle} size={44} />
                  <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: C.ink, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {selectedProfile?.name || selected.customerName || selectedProfile?.username || selected.contactHandle}
                    {selectedProfile?.is_verified_user && <BadgeCheck size={15} fill="#3B82F6" color="#fff" aria-label="Verified Instagram account" />}
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft }}>
                    {selectedProfile?.username ? `@${selectedProfile.username}` : `Instagram · ${selected.contactHandle}`}
                  </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selectedProfile?.username && (
                    <a
                      href={`https://www.instagram.com/${encodeURIComponent(selectedProfile.username)}/`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '7px 11px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: `1px solid ${C.rule}`, color: C.ink, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <ExternalLink size={12} /> Instagram
                    </a>
                  )}
                  <button onClick={() => handleStatus('open')} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: `1px solid ${C.rule}`, color: C.inkSoft }}>
                    {t('markNeedsReview', lang)}
                  </button>
                  <button onClick={() => handleStatus('escalated')} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: '1px solid #E1B3AA', color: '#B95545' }}>
                    {t('escalateAction', lang)}
                  </button>
                  <button onClick={() => handleStatus('resolved')} style={{ padding: '7px 14px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: '1px solid #BFD3B6', color: '#3F754D' }}>
                    {t('markResolved', lang)}
                  </button>
                </div>
              </div>

              <div style={{ margin: '12px 20px 0', padding: 12, border: `1px solid ${C.ruleLight}`, borderRadius: 8, background: '#FFFDF6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: C.ink, marginBottom: 7 }}>
                  <StickyNote size={13} /> {lang === 'pt' ? 'Nota interna' : 'Internal note'}
                  <span style={{ fontWeight: 500, color: C.inkSoft }}>{lang === 'pt' ? '— nunca enviada ao Instagram' : '— never sent to Instagram'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={selectedNoteDraft}
                    onChange={(event) => setNoteDrafts((current) => ({ ...current, [selected.key]: event.target.value }))}
                    placeholder={lang === 'pt' ? 'Ex.: aguarda confirmação de stock' : 'E.g. waiting for stock confirmation'}
                    maxLength={500}
                    style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper }}
                  />
                  <button onClick={handleNoteSave} disabled={savingNote} style={{ padding: '8px 13px', borderRadius: 6, background: C.black, color: C.onDarkGold, fontSize: 10, fontWeight: 800 }}>
                    {savingNote ? '…' : lang === 'pt' ? 'Guardar' : 'Save'}
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
                      <InstagramContextCard message={m} lang={lang} />
                      <div>{m.body}</div>
                      {m.automationNote && (
                        <div style={{ fontSize: 10, color: m.direction === 'outbound' ? C.onDarkGold : C.inkSoft, marginTop: 4 }}>{m.automationNote}</div>
                      )}
                      <time dateTime={m.createdAt} style={{ display: 'block', fontSize: 9, opacity: 0.72, marginTop: 5 }}>
                        {new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(m.createdAt))}
                      </time>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 16, borderTop: `1px solid ${C.ruleLight}`, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('writeAReply', lang)}
                  rows={2}
                  maxLength={1000}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                  style={{ flex: 1, resize: 'vertical', minHeight: 42, padding: '10px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper }}
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

function ProfileAvatar({ profile, fallback, size }: { profile?: InstagramProfile | null; fallback: string; size: number }) {
  if (profile?.profile_pic) {
    return <img src={profile.profile_pic} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: '0 0 auto', border: `1px solid ${C.ruleLight}` }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flex: '0 0 auto', display: 'grid', placeItems: 'center', background: C.black, color: C.onDarkGold, fontSize: Math.max(11, size * 0.32), fontWeight: 800 }}>
      {fallback.slice(0, 1).toUpperCase()}
    </div>
  );
}

function InstagramContextCard({ message, lang }: { message: ApiMessage; lang: 'pt' | 'en' }) {
  const [previewAttempt, setPreviewAttempt] = useState<'image' | 'video' | 'failed'>('image');
  if (!message.instagramContextType) return null;
  const labels = {
    story_reply: lang === 'pt' ? 'Resposta ao teu story' : 'Reply to your story',
    shared_post: lang === 'pt' ? 'Publicação partilhada' : 'Shared Instagram post',
    media: lang === 'pt' ? 'Conteúdo enviado' : 'Sent media',
    inline_reply: lang === 'pt' ? 'Em resposta a' : 'Replying to',
    unsupported_media: lang === 'pt' ? 'Conteúdo disponível no Instagram' : 'Content available on Instagram',
  };
  const label = labels[message.instagramContextType];
  const isKnownVideo = ['reel', 'ig_reel', 'video', 'story_video'].includes(message.instagramContextMediaType ?? '')
    || /\.(mp4|mov|webm)(?:\?|$)/i.test(message.instagramContextUrl ?? '');
  const showVideo = isKnownVideo || previewAttempt === 'video';
  const hasPreview = Boolean(message.instagramContextUrl) && previewAttempt !== 'failed';
  const handlePreviewError = () => setPreviewAttempt(showVideo ? 'failed' : 'video');
  const needsFallback = message.instagramContextType === 'unsupported_media'
    || (!hasPreview && ['story_reply', 'shared_post', 'media'].includes(message.instagramContextType));

  return (
    <div style={{ marginBottom: 8, borderRadius: 7, overflow: 'hidden', border: '1px solid rgba(183,146,75,0.35)', background: message.direction === 'outbound' ? 'rgba(255,255,255,0.08)' : '#fff' }}>
      {hasPreview && !showVideo && (
        <img
          src={message.instagramContextUrl}
          alt={label}
          referrerPolicy="no-referrer"
          onError={handlePreviewError}
          style={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'cover', background: C.subtleBg }}
        />
      )}
      {hasPreview && showVideo && (
        <video
          src={message.instagramContextUrl}
          controls
          preload="metadata"
          onError={handlePreviewError}
          style={{ display: 'block', width: '100%', maxHeight: 240, background: '#000' }}
        />
      )}
      <div style={{ padding: '8px 10px', fontSize: 10, fontWeight: 800 }}>
        {label}
        {message.replyToText && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 500, opacity: 0.78, borderLeft: `2px solid ${C.gold}`, paddingLeft: 7 }}>{message.replyToText}</div>}
        {needsFallback && (
          <div style={{ marginTop: 4, fontWeight: 500, opacity: 0.72 }}>
            {lang === 'pt' ? 'A pré-visualização não está disponível. Abre a conversa no Instagram para ver.' : 'Preview unavailable. Open the conversation on Instagram to view it.'}
          </div>
        )}
        {message.instagramContextPermalink && (
          <a
            href={message.instagramContextPermalink}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 7, color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            <ExternalLink size={11} /> {lang === 'pt' ? 'Abrir publicação no Instagram' : 'Open post on Instagram'}
          </a>
        )}
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
