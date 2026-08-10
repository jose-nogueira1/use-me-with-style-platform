import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminUpdateStorefrontContent, fetchStorefrontContent, type StorefrontFaqEntry } from '../../lib/api';
import { normalizeStorefrontContent, type NormalizedStorefrontContent } from '../../lib/storefrontContent';
import { PageHeader } from '../components/PageHeader';
import { useDirty } from '../lib/useDirty';
import { t, type Lang } from '../i18n';

type ContentTab = 'faq' | 'size-guide';

export function Content() {
  const { lang } = useApp();
  const [tab, setTab] = useState<ContentTab>('faq');
  const [content, setContent] = useState<NormalizedStorefrontContent | null>(null);
  const [original, setOriginal] = useState<NormalizedStorefrontContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useDirty(content, original);

  useEffect(() => {
    fetchStorefrontContent()
      .then((value) => {
        const normalized = normalizeStorefrontContent(value);
        setContent(normalized);
        setOriginal(normalized);
      })
      .catch(() => setError(t('couldntConnectBackend', lang)));
  }, [lang]);

  if (!content) return <div style={{ padding: 28, color: error ? C.danger : C.inkSoft }}>{error || t('loadingEllipsis', lang)}</div>;

  const faqValid = content.faqEntries.every((entry) => entry.enabled === false || Boolean(entry.questionPT.trim() && entry.questionEN.trim() && entry.answerPT.trim() && entry.answerEN.trim()));
  const save = async () => {
    if (!faqValid) {
      setError(t('contentRequiredError', lang));
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = normalizeStorefrontContent(await adminUpdateStorefrontContent(content));
      setContent(updated);
      setOriginal(updated);
      setSaved(true);
    } catch {
      setError(t('couldntSaveLoggedIn', lang));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('contentEyebrow', lang)}
        title={t('contentTitle', lang)}
        subtitle={t('contentSubtitle', lang)}
        cta={saving ? t('savingEllipsis', lang) : t('saveChanges', lang)}
        onCta={() => void save()}
        ctaBusy={saving}
        ctaDisabled={!dirty || saving || !faqValid}
      />
      <div style={{ padding: '20px 28px 0', display: 'flex', gap: 8 }}>
        <TabButton active={tab === 'faq'} onClick={() => setTab('faq')}>{t('contentFaqTab', lang)}</TabButton>
        <TabButton active={tab === 'size-guide'} onClick={() => setTab('size-guide')}>{t('contentSizeGuideTab', lang)}</TabButton>
      </div>
      {error && <div role="alert" style={{ margin: '16px 28px 0', color: C.danger, fontSize: 12 }}>{error}</div>}
      {saved && <div role="status" style={{ margin: '16px 28px 0', color: C.successText, fontSize: 12 }}>{t('savedNotice', lang)}</div>}
      {tab === 'faq'
        ? <FaqEditor content={content} setContent={setContent} lang={lang} />
        : <SizeGuideCopyEditor content={content} setContent={setContent} lang={lang} />}
    </div>
  );
}

function FaqEditor({ content, setContent, lang }: EditorProps) {
  const updateEntry = (index: number, patch: Partial<StorefrontFaqEntry>) => {
    setContent((current) => current && ({ ...current, faqEntries: current.faqEntries.map((entry, i) => i === index ? { ...entry, ...patch } : entry) }));
  };
  const move = (index: number, direction: -1 | 1) => {
    setContent((current) => {
      if (!current) return current;
      const next = [...current.faqEntries];
      const destination = index + direction;
      if (destination < 0 || destination >= next.length) return current;
      [next[index], next[destination]] = [next[destination], next[index]];
      return { ...current, faqEntries: next };
    });
  };
  const remove = (index: number) => setContent((current) => current && ({ ...current, faqEntries: current.faqEntries.filter((_, i) => i !== index) }));
  const add = () => setContent((current) => current && ({
    ...current,
    faqEntries: [...current.faqEntries, { id: crypto.randomUUID(), enabled: true, questionPT: '', questionEN: '', answerPT: '', answerEN: '' }],
  }));

  return (
    <div className="ump-admin-orders-grid" style={pageStyle}>
      <Section title={t('contentPageCopy', lang)}>
        <BilingualField label={t('contentPageTitle', lang)} valuePT={content.faqTitlePT} valueEN={content.faqTitleEN} onPT={(value) => setScalar(setContent, 'faqTitlePT', value)} onEN={(value) => setScalar(setContent, 'faqTitleEN', value)} />
        <BilingualField multiline label={t('contentIntroduction', lang)} valuePT={content.faqIntroPT} valueEN={content.faqIntroEN} onPT={(value) => setScalar(setContent, 'faqIntroPT', value)} onEN={(value) => setScalar(setContent, 'faqIntroEN', value)} />
        <BilingualField label={t('contentSupportPrompt', lang)} valuePT={content.faqSupportPromptPT} valueEN={content.faqSupportPromptEN} onPT={(value) => setScalar(setContent, 'faqSupportPromptPT', value)} onEN={(value) => setScalar(setContent, 'faqSupportPromptEN', value)} />
        <BilingualField label={t('contentSupportLinkLabel', lang)} valuePT={content.faqSupportLabelPT} valueEN={content.faqSupportLabelEN} onPT={(value) => setScalar(setContent, 'faqSupportLabelPT', value)} onEN={(value) => setScalar(setContent, 'faqSupportLabelEN', value)} />
      </Section>
      <Section title={t('contentSeo', lang)} hint={t('contentSeoHint', lang)}>
        <BilingualField label={t('contentSeoTitle', lang)} valuePT={content.faqSeoTitlePT} valueEN={content.faqSeoTitleEN} onPT={(value) => setScalar(setContent, 'faqSeoTitlePT', value)} onEN={(value) => setScalar(setContent, 'faqSeoTitleEN', value)} />
        <BilingualField multiline label={t('contentSeoDescription', lang)} valuePT={content.faqSeoDescriptionPT} valueEN={content.faqSeoDescriptionEN} onPT={(value) => setScalar(setContent, 'faqSeoDescriptionPT', value)} onEN={(value) => setScalar(setContent, 'faqSeoDescriptionEN', value)} />
      </Section>
      <Section title={t('contentFaqEntries', lang)} hint={t('contentFaqHint', lang)} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {content.faqEntries.map((entry, index) => (
            <div key={entry.id ?? index} style={{ border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 14, background: C.subtleBg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: C.ink, fontSize: 11, fontWeight: 800 }}>
                  <input type="checkbox" checked={entry.enabled !== false} onChange={(event) => updateEntry(index, { enabled: event.target.checked })} />
                  {t('contentEnabled', lang)}
                </label>
                <IconButton label={t('contentMoveUp', lang)} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={14} /></IconButton>
                <IconButton label={t('contentMoveDown', lang)} disabled={index === content.faqEntries.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14} /></IconButton>
                <IconButton label={t('contentDeleteQuestion', lang)} danger onClick={() => remove(index)}><Trash2 size={14} /></IconButton>
              </div>
              <BilingualField label={t('contentQuestion', lang)} valuePT={entry.questionPT} valueEN={entry.questionEN} onPT={(value) => updateEntry(index, { questionPT: value })} onEN={(value) => updateEntry(index, { questionEN: value })} />
              <BilingualField multiline label={t('contentAnswerFallback', lang)} valuePT={entry.answerPT} valueEN={entry.answerEN} onPT={(value) => updateEntry(index, { answerPT: value })} onEN={(value) => updateEntry(index, { answerEN: value })} />
              <BilingualField multiline optional label={t('contentAnswerPortugal', lang)} valuePT={entry.answerPTPT ?? ''} valueEN={entry.answerENPT ?? ''} onPT={(value) => updateEntry(index, { answerPTPT: value })} onEN={(value) => updateEntry(index, { answerENPT: value })} />
              <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, margin: '14px 0 7px' }}>{t('contentOptionalLink', lang)}</div>
              <input aria-label={t('contentLinkPath', lang)} placeholder={t('contentLinkPath', lang)} value={entry.linkPath ?? ''} onChange={(event) => updateEntry(index, { linkPath: event.target.value })} style={inputStyle} />
              <BilingualField optional label={t('contentLinkLabel', lang)} valuePT={entry.linkLabelPT ?? ''} valueEN={entry.linkLabelEN ?? ''} onPT={(value) => updateEntry(index, { linkLabelPT: value })} onEN={(value) => updateEntry(index, { linkLabelEN: value })} />
            </div>
          ))}
          <button type="button" onClick={add} style={secondaryButtonStyle}>{t('contentAddQuestion', lang)}</button>
        </div>
      </Section>
    </div>
  );
}

function SizeGuideCopyEditor({ content, setContent, lang }: EditorProps) {
  return (
    <div className="ump-admin-orders-grid" style={pageStyle}>
      <Section title={t('contentPageCopy', lang)} wide>
        <BilingualField label={t('contentPageTitle', lang)} valuePT={content.sizeGuideTitlePT} valueEN={content.sizeGuideTitleEN} onPT={(value) => setScalar(setContent, 'sizeGuideTitlePT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideTitleEN', value)} />
        <BilingualField multiline label={t('contentIntroduction', lang)} valuePT={content.sizeGuideIntroPT} valueEN={content.sizeGuideIntroEN} onPT={(value) => setScalar(setContent, 'sizeGuideIntroPT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideIntroEN', value)} />
        <BilingualField label={t('contentHowToTitle', lang)} valuePT={content.sizeGuideHowToTitlePT} valueEN={content.sizeGuideHowToTitleEN} onPT={(value) => setScalar(setContent, 'sizeGuideHowToTitlePT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideHowToTitleEN', value)} />
        {([
          ['contentBustInstruction', 'sizeGuideBustPT', 'sizeGuideBustEN'],
          ['contentWaistInstruction', 'sizeGuideWaistPT', 'sizeGuideWaistEN'],
          ['contentHipInstruction', 'sizeGuideHipPT', 'sizeGuideHipEN'],
          ['contentLengthInstruction', 'sizeGuideLengthPT', 'sizeGuideLengthEN'],
        ] as const).map(([labelKey, ptKey, enKey]) => (
          <BilingualField key={ptKey} label={t(labelKey, lang)} valuePT={content[ptKey]} valueEN={content[enKey]} onPT={(value) => setScalar(setContent, ptKey, value)} onEN={(value) => setScalar(setContent, enKey, value)} />
        ))}
        <BilingualField multiline label={t('contentClosingText', lang)} valuePT={content.sizeGuideClosingPT} valueEN={content.sizeGuideClosingEN} onPT={(value) => setScalar(setContent, 'sizeGuideClosingPT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideClosingEN', value)} />
        <BilingualField label={t('contentSupportLinkLabel', lang)} valuePT={content.sizeGuideSupportLabelPT} valueEN={content.sizeGuideSupportLabelEN} onPT={(value) => setScalar(setContent, 'sizeGuideSupportLabelPT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideSupportLabelEN', value)} />
        <BilingualField label={t('contentCatalogueLinkLabel', lang)} valuePT={content.sizeGuideCatalogLabelPT} valueEN={content.sizeGuideCatalogLabelEN} onPT={(value) => setScalar(setContent, 'sizeGuideCatalogLabelPT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideCatalogLabelEN', value)} />
      </Section>
      <Section title={t('contentSeo', lang)} hint={t('contentSeoHint', lang)}>
        <BilingualField label={t('contentSeoTitle', lang)} valuePT={content.sizeGuideSeoTitlePT} valueEN={content.sizeGuideSeoTitleEN} onPT={(value) => setScalar(setContent, 'sizeGuideSeoTitlePT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideSeoTitleEN', value)} />
        <BilingualField multiline label={t('contentSeoDescription', lang)} valuePT={content.sizeGuideSeoDescriptionPT} valueEN={content.sizeGuideSeoDescriptionEN} onPT={(value) => setScalar(setContent, 'sizeGuideSeoDescriptionPT', value)} onEN={(value) => setScalar(setContent, 'sizeGuideSeoDescriptionEN', value)} />
      </Section>
    </div>
  );
}

type EditorProps = { content: NormalizedStorefrontContent; setContent: React.Dispatch<React.SetStateAction<NormalizedStorefrontContent | null>>; lang: Lang };
type ScalarKey = keyof Omit<NormalizedStorefrontContent, 'faqEntries'>;

function setScalar(setContent: EditorProps['setContent'], key: ScalarKey, value: string) {
  setContent((current) => current && ({ ...current, [key]: value }));
}

function Section({ title, hint, wide, children }: { title: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return <section style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18, gridColumn: wide ? '1 / -1' : undefined }}>
    <h2 style={{ margin: 0, color: C.ink, fontSize: 14 }}>{title}</h2>
    {hint && <p style={{ color: C.inkSoft, fontSize: 10.5, lineHeight: 1.55, margin: '5px 0 0' }}>{hint}</p>}
    <div style={{ marginTop: 14 }}>{children}</div>
  </section>;
}

function BilingualField({ label, valuePT, valueEN, onPT, onEN, multiline, optional }: { label: string; valuePT: string; valueEN: string; onPT: (value: string) => void; onEN: (value: string) => void; multiline?: boolean; optional?: boolean }) {
  const Field = multiline ? 'textarea' : 'input';
  return <div style={{ marginBottom: 12 }}>
    <div style={{ color: C.goldDeep, fontSize: 9, fontWeight: 800, marginBottom: 6 }}>{label}{optional ? '' : ' *'}</div>
    <div className="ump-admin-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Field aria-label={`${label} — PT`} placeholder="Português" value={valuePT} onChange={(event) => onPT(event.target.value)} rows={multiline ? 3 : undefined} style={inputStyle} />
      <Field aria-label={`${label} — EN`} placeholder="English" value={valueEN} onChange={(event) => onEN(event.target.value)} rows={multiline ? 3 : undefined} style={inputStyle} />
    </div>
  </div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} style={{ padding: '8px 13px', borderRadius: 20, background: active ? C.black : C.paper, color: active ? C.onDarkGold : C.ink, border: `1px solid ${active ? C.black : C.rule}`, fontSize: 11, fontWeight: 800 }}>{children}</button>;
}

function IconButton({ label, disabled, danger, onClick, children }: { label: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 6, border: `1px solid ${C.rule}`, color: danger ? C.danger : C.inkSoft, opacity: disabled ? 0.35 : 1 }}>{children}</button>;
}

const pageStyle = { padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' } as const;
const inputStyle = { width: '100%', padding: '9px 10px', border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink, fontFamily: 'inherit', fontSize: 11, lineHeight: 1.5 } as const;
const secondaryButtonStyle = { alignSelf: 'flex-start', padding: '9px 13px', borderRadius: 6, border: `1px solid ${C.goldDeep}`, color: C.goldDeep, fontSize: 10, fontWeight: 800 } as const;
