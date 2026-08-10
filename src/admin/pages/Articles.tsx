import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminCreatePost,
  adminDeletePost,
  adminListPosts,
  adminUpdatePost,
  type ApiPost,
  type ApiPostBlock,
} from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { useDirty } from '../lib/useDirty';

type PostDraft = {
  titlePT: string;
  titleEN: string;
  excerptPT: string;
  excerptEN: string;
  body: ApiPostBlock[];
  seoTitlePT: string;
  seoTitleEN: string;
  seoDescriptionPT: string;
  seoDescriptionEN: string;
  status: 'draft' | 'published';
  publishedAt: string;
  availableAO: boolean;
  availablePT: boolean;
};

const EMPTY_DRAFT: PostDraft = {
  titlePT: '', titleEN: '', excerptPT: '', excerptEN: '', body: [],
  seoTitlePT: '', seoTitleEN: '', seoDescriptionPT: '', seoDescriptionEN: '',
  status: 'draft', publishedAt: '', availableAO: true, availablePT: true,
};

function draftFromPost(post: ApiPost): PostDraft {
  return {
    titlePT: post.titlePT,
    titleEN: post.titleEN,
    excerptPT: post.excerptPT,
    excerptEN: post.excerptEN,
    body: post.body,
    seoTitlePT: post.seoTitlePT,
    seoTitleEN: post.seoTitleEN,
    seoDescriptionPT: post.seoDescriptionPT,
    seoDescriptionEN: post.seoDescriptionEN,
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.slice(0, 16) : '',
    availableAO: post.availableAO,
    availablePT: post.availablePT,
  };
}

export function Articles() {
  const { lang } = useApp();
  const pt = lang === 'pt';
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [editing, setEditing] = useState<'new' | string | null>(null);
  const [draft, setDraft] = useState<PostDraft>(EMPTY_DRAFT);
  const [original, setOriginal] = useState<PostDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useDirty(draft, original);

  const load = useCallback(() => {
    setError(null);
    adminListPosts().then(setPosts).catch(() => setError(pt ? 'Não foi possível carregar os artigos.' : 'Articles could not be loaded.'));
  }, [pt]);
  useEffect(() => {
    let cancelled = false;
    adminListPosts()
      .then((rows) => { if (!cancelled) setPosts(rows); })
      .catch(() => { if (!cancelled) setError(pt ? 'Não foi possível carregar os artigos.' : 'Articles could not be loaded.'); });
    return () => { cancelled = true; };
  }, [pt]);

  const startNew = () => {
    setDraft(EMPTY_DRAFT);
    setOriginal(EMPTY_DRAFT);
    setEditing('new');
    setError(null);
  };
  const startEdit = (post: ApiPost) => {
    const next = draftFromPost(post);
    setDraft(next);
    setOriginal(next);
    setEditing(String(post.id));
    setError(null);
  };
  const update = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateBlock = (index: number, patch: Partial<ApiPostBlock>) => update('body', draft.body.map((block, i) => i === index ? { ...block, ...patch } : block));
  const moveBlock = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= draft.body.length) return;
    const body = [...draft.body];
    [body[index], body[destination]] = [body[destination], body[index]];
    update('body', body);
  };
  const addBlock = () => update('body', [...draft.body, { id: crypto.randomUUID(), kind: 'section', headingPT: '', headingEN: '', textPT: '', textEN: '' }]);

  const valid = Boolean(
    draft.titlePT.trim() && draft.titleEN.trim() && draft.excerptPT.trim() && draft.excerptEN.trim()
    && draft.seoTitlePT.trim() && draft.seoTitleEN.trim() && draft.seoDescriptionPT.trim() && draft.seoDescriptionEN.trim()
    && draft.body.length > 0
    && draft.body.every((block) => block.textPT.trim() && block.textEN.trim() && (block.kind !== 'section' || (block.headingPT?.trim() && block.headingEN?.trim()))),
  );

  const save = async () => {
    if (!valid) {
      setError(pt ? 'Preencha todos os campos bilingues e adicione pelo menos um bloco válido.' : 'Complete every bilingual field and add at least one valid content block.');
      return;
    }
    setBusy(true);
    setError(null);
    const input = {
      ...draft,
      publishedAt: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : null,
    };
    try {
      if (editing === 'new') await adminCreatePost(input);
      else if (editing) await adminUpdatePost(editing, input);
      setEditing(null);
      setOriginal(null);
      load();
    } catch {
      setError(pt ? 'Não foi possível guardar o artigo.' : 'The article could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (post: ApiPost) => {
    if (!window.confirm(pt ? `Eliminar “${post.titlePT}”?` : `Delete “${post.titleEN}”?`)) return;
    try {
      await adminDeletePost(post.id);
      setPosts((current) => current?.filter((item) => item.id !== post.id) ?? null);
    } catch {
      setError(pt ? 'Não foi possível eliminar o artigo.' : 'The article could not be deleted.');
    }
  };

  return (
    <div style={{ paddingBottom: 36 }}>
      <PageHeader
        eyebrow={pt ? 'Conteúdo' : 'Content'}
        title={pt ? 'Artigos' : 'Articles'}
        subtitle={pt ? 'Crie e publique o guia de estilo bilingue da loja.' : 'Create and publish the storefront’s bilingual style guide.'}
        cta={editing === null ? (pt ? 'Novo artigo' : 'New article') : undefined}
        onCta={editing === null ? startNew : undefined}
      />
      {error && <div role="alert" style={{ margin: '16px 28px 0', color: C.danger, fontSize: 12 }}>{error}</div>}

      {editing !== null ? (
        <ArticleEditor
          draft={draft}
          update={update}
          updateBlock={updateBlock}
          moveBlock={moveBlock}
          addBlock={addBlock}
          removeBlock={(index) => update('body', draft.body.filter((_, i) => i !== index))}
          valid={valid}
          dirty={dirty}
          busy={busy}
          isNew={editing === 'new'}
          pt={pt}
          onSave={() => void save()}
          onCancel={() => { setEditing(null); setOriginal(null); setError(null); }}
        />
      ) : (
        <div style={{ padding: '20px 28px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts === null ? <div style={{ color: C.inkSoft, fontSize: 13 }}>{pt ? 'A carregar…' : 'Loading…'}</div> : null}
          {posts?.length === 0 ? <div style={{ color: C.inkSoft, fontSize: 13 }}>{pt ? 'Ainda não existem artigos.' : 'There are no articles yet.'}</div> : null}
          {posts?.map((post) => (
            <article key={post.id} style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 9, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: C.ink }}>{pt ? post.titlePT : post.titleEN}</div>
                <div style={{ color: C.inkSoft, fontSize: 11, marginTop: 4 }}>/estilo/{post.slug} · {post.status === 'published' ? (pt ? 'Publicado' : 'Published') : (pt ? 'Rascunho' : 'Draft')} · {[post.availableAO && 'AO', post.availablePT && 'PT'].filter(Boolean).join(' / ')}</div>
              </div>
              <button type="button" onClick={() => startEdit(post)} style={secondaryButton}>{pt ? 'Editar' : 'Edit'}</button>
              <button type="button" onClick={() => void remove(post)} aria-label={`${pt ? 'Eliminar' : 'Delete'} ${pt ? post.titlePT : post.titleEN}`} style={{ ...secondaryButton, color: C.danger }}><Trash2 size={14} /></button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

type EditorProps = {
  draft: PostDraft;
  update: <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => void;
  updateBlock: (index: number, patch: Partial<ApiPostBlock>) => void;
  moveBlock: (index: number, direction: -1 | 1) => void;
  addBlock: () => void;
  removeBlock: (index: number) => void;
  valid: boolean;
  dirty: boolean;
  busy: boolean;
  isNew: boolean;
  pt: boolean;
  onSave: () => void;
  onCancel: () => void;
};

function ArticleEditor({ draft, update, updateBlock, moveBlock, addBlock, removeBlock, valid, dirty, busy, isNew, pt, onSave, onCancel }: EditorProps) {
  return (
    <div style={{ padding: '20px 28px 0', maxWidth: 980 }}>
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>{pt ? 'Informação principal' : 'Main information'}</h2>
        <BilingualField label={pt ? 'Título' : 'Title'} valuePT={draft.titlePT} valueEN={draft.titleEN} onPT={(value) => update('titlePT', value)} onEN={(value) => update('titleEN', value)} />
        <BilingualField multiline label={pt ? 'Resumo' : 'Excerpt'} valuePT={draft.excerptPT} valueEN={draft.excerptEN} onPT={(value) => update('excerptPT', value)} onEN={(value) => update('excerptEN', value)} />
        <div className="ump-admin-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <Field label={pt ? 'Estado' : 'Status'}><select value={draft.status} onChange={(event) => update('status', event.target.value as PostDraft['status'])} style={inputStyle}><option value="draft">{pt ? 'Rascunho' : 'Draft'}</option><option value="published">{pt ? 'Publicado' : 'Published'}</option></select></Field>
          <Field label={pt ? 'Data de publicação' : 'Publication date'}><input type="datetime-local" value={draft.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} style={inputStyle} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Checkbox label={pt ? 'Loja Angola' : 'Angola store'} checked={draft.availableAO} onChange={(value) => update('availableAO', value)} />
          <Checkbox label={pt ? 'Loja Portugal' : 'Portugal store'} checked={draft.availablePT} onChange={(value) => update('availablePT', value)} />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitle}>{pt ? 'Corpo do artigo' : 'Article body'}</h2>
        <p style={{ color: C.inkSoft, fontSize: 12, margin: '-4px 0 14px' }}>{pt ? 'Use secções, parágrafos e listas. Nas listas, escreva um item por linha.' : 'Use sections, paragraphs and lists. For lists, enter one item per line.'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {draft.body.map((block, index) => (
            <div key={block.id ?? index} style={{ background: C.subtleBg, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <select value={block.kind} onChange={(event) => updateBlock(index, { kind: event.target.value as ApiPostBlock['kind'] })} aria-label={pt ? 'Tipo de bloco' : 'Block type'} style={{ ...inputStyle, flex: 1 }}>
                  <option value="section">{pt ? 'Secção com título' : 'Section with heading'}</option>
                  <option value="paragraph">{pt ? 'Parágrafo' : 'Paragraph'}</option>
                  <option value="bullets">{pt ? 'Lista' : 'Bulleted list'}</option>
                </select>
                <IconButton label={pt ? 'Mover para cima' : 'Move up'} disabled={index === 0} onClick={() => moveBlock(index, -1)}><ArrowUp size={14} /></IconButton>
                <IconButton label={pt ? 'Mover para baixo' : 'Move down'} disabled={index === draft.body.length - 1} onClick={() => moveBlock(index, 1)}><ArrowDown size={14} /></IconButton>
                <IconButton label={pt ? 'Eliminar bloco' : 'Delete block'} onClick={() => removeBlock(index)}><Trash2 size={14} /></IconButton>
              </div>
              {block.kind !== 'paragraph' ? <BilingualField label={pt ? 'Título da secção' : 'Section heading'} valuePT={block.headingPT ?? ''} valueEN={block.headingEN ?? ''} onPT={(value) => updateBlock(index, { headingPT: value })} onEN={(value) => updateBlock(index, { headingEN: value })} /> : null}
              <BilingualField multiline label={block.kind === 'bullets' ? (pt ? 'Itens' : 'Items') : (pt ? 'Texto' : 'Text')} valuePT={block.textPT} valueEN={block.textEN} onPT={(value) => updateBlock(index, { textPT: value })} onEN={(value) => updateBlock(index, { textEN: value })} />
            </div>
          ))}
          <button type="button" onClick={addBlock} style={secondaryButton}>{pt ? '+ Adicionar bloco' : '+ Add block'}</button>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitle}>SEO</h2>
        <BilingualField label={pt ? 'Título SEO' : 'SEO title'} valuePT={draft.seoTitlePT} valueEN={draft.seoTitleEN} onPT={(value) => update('seoTitlePT', value)} onEN={(value) => update('seoTitleEN', value)} />
        <BilingualField multiline label={pt ? 'Descrição SEO' : 'SEO description'} valuePT={draft.seoDescriptionPT} valueEN={draft.seoDescriptionEN} onPT={(value) => update('seoDescriptionPT', value)} onEN={(value) => update('seoDescriptionEN', value)} />
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" onClick={onCancel} style={secondaryButton}>{pt ? 'Cancelar' : 'Cancel'}</button>
        <button type="button" onClick={onSave} disabled={!valid || !dirty || busy} style={{ ...primaryButton, opacity: !valid || !dirty || busy ? 0.5 : 1 }}>{busy ? (pt ? 'A guardar…' : 'Saving…') : (isNew ? (pt ? 'Criar artigo' : 'Create article') : (pt ? 'Guardar alterações' : 'Save changes'))}</button>
      </div>
    </div>
  );
}

function BilingualField({ label, valuePT, valueEN, onPT, onEN, multiline = false }: { label: string; valuePT: string; valueEN: string; onPT: (value: string) => void; onEN: (value: string) => void; multiline?: boolean }) {
  const Input = multiline ? 'textarea' : 'input';
  return (
    <Field label={`${label} *`}>
      <div className="ump-admin-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <Input aria-label={`${label} — PT`} placeholder="Português" value={valuePT} onChange={(event) => onPT(event.target.value)} rows={multiline ? 5 : undefined} style={{ ...inputStyle, resize: multiline ? 'vertical' : undefined }} />
        <Input aria-label={`${label} — EN`} placeholder="English" value={valueEN} onChange={(event) => onEN(event.target.value)} rows={multiline ? 5 : undefined} style={{ ...inputStyle, resize: multiline ? 'vertical' : undefined }} />
      </div>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block', marginBottom: 14 }}><span style={{ display: 'block', color: C.ink, fontSize: 11, fontWeight: 800, marginBottom: 7 }}>{label}</span>{children}</label>;
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink, fontSize: 12, fontWeight: 700 }}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} style={{ ...secondaryButton, padding: 8, opacity: disabled ? 0.35 : 1 }}>{children}</button>;
}

const sectionStyle: React.CSSProperties = { background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 9, padding: 18, marginBottom: 16 };
const sectionTitle: React.CSSProperties = { fontFamily: F.display, color: C.ink, fontSize: 17, margin: '0 0 16px' };
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 40, padding: '9px 10px', borderRadius: 6, border: `1px solid ${C.fieldBorder}`, background: C.paper, color: C.ink, fontFamily: 'inherit', fontSize: 12 };
const secondaryButton: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '9px 13px', borderRadius: 6, border: `1px solid ${C.fieldBorder}`, background: C.paper, color: C.ink, fontSize: 11, fontWeight: 800 };
const primaryButton: React.CSSProperties = { ...secondaryButton, background: C.goldDeep, color: C.white, borderColor: C.goldDeep };
