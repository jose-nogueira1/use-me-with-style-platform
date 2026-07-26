import { useApp } from '../state/AppContext';

// Was previously a runtime DOM-text-walker (AdminTranslationBoundary) that
// exact-string-matched hardcoded English/Portuguese JSX text against a flat
// dictionary. Replaced 2026-07-26 by src/admin/i18n.ts's key-based t()
// pattern (same shape as the storefront's src/theme/i18n.ts) after a
// bilingual audit found the walker silently failed on any new string, any
// dynamic/composite string, and any native confirm()/alert() dialog. Only
// the language-switch control lives here now; every page calls t() directly.
export function AdminLanguageSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useApp();
  return (
    <div aria-label={lang === 'pt' ? 'Idioma da administração' : 'Admin language'} style={{ display: 'flex', gap: 4 }}>
      {(['pt', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          style={{
            padding: '5px 8px',
            borderRadius: 5,
            fontSize: 10,
            fontWeight: 800,
            border: `1px solid ${lang === option ? '#C8A96A' : dark ? '#3B332A' : '#D8D0C5'}`,
            background: lang === option ? '#C8A96A' : 'transparent',
            color: lang === option ? '#0B0A08' : dark ? '#D5CEC3' : '#3B352E',
          }}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
