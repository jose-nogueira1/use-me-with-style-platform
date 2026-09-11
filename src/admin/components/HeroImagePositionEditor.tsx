import type { Dispatch, SetStateAction } from 'react';
import { C, type Lang } from '../../theme';
import type { HomeHero } from '../../lib/api';
import { heroPosition } from '../../lib/heroPosition';

// Keep position editing and its visual feedback together; the parent owns save/upload state.
export function HeroImagePositionEditor({ content, setContent, saving, lang, heroImageUrl }: {
  content: HomeHero;
  setContent: Dispatch<SetStateAction<HomeHero>>;
  saving: boolean;
  lang: Lang;
  heroImageUrl?: string;
}) {
  return (
    <>
      {(['desktop', 'mobile'] as const).map((layout) => (
        <fieldset key={layout} style={{ border: `1px solid ${C.rule}`, borderRadius: 8, padding: 12, margin: '0 0 12px' }}>
          <legend style={{ fontSize: 11, fontWeight: 800, color: C.ink }}>{layout === 'desktop' ? (lang === 'pt' ? 'Posição desktop' : 'Desktop position') : (lang === 'pt' ? 'Posição mobile' : 'Mobile position')}</legend>
          {(['X', 'Y'] as const).map(axis => {
            const key = `hero${layout === 'desktop' ? 'Desktop' : 'Mobile'}Position${axis}` as 'heroDesktopPositionX' | 'heroDesktopPositionY' | 'heroMobilePositionX' | 'heroMobilePositionY';
            const value = content[key] ?? (layout === 'desktop' ? (axis === 'X' ? 65 : 20) : 50);
            return <label key={axis} style={{ display: 'block', fontSize: 11, color: C.inkSoft, marginBottom: 8 }}>
              {axis === 'X' ? (lang === 'pt' ? 'Horizontal — esquerda / direita' : 'Horizontal — left / right') : (lang === 'pt' ? 'Vertical — cima / baixo' : 'Vertical — top / bottom')} · {value}%
              <input type="range" min={0} max={100} step={1} value={value} disabled={saving} onChange={event => setContent(previous => ({ ...previous, [key]: Number(event.target.value) }))} style={{ display: 'block', width: '100%', marginTop: 6, accentColor: C.goldDeep }} />
            </label>;
          })}
          <button type="button" disabled={saving} onClick={() => setContent(previous => layout === 'desktop' ? { ...previous, heroDesktopPositionX: 65, heroDesktopPositionY: 20 } : { ...previous, heroMobilePositionX: 50, heroMobilePositionY: 50 })} style={{ fontSize: 10, color: C.goldDeep, textDecoration: 'underline' }}>{lang === 'pt' ? 'Repor posição inicial' : 'Reset position'}</button>
        </fieldset>
      ))}
      <p style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>{lang === 'pt' ? 'A posição só altera o enquadramento quando a imagem é recortada pelo ecrã. Veja o resultado nas pré-visualizações e selecione Guardar destaque.' : 'Position changes the framing where the screen crops the image. Check the previews, then select Save hero.'}</p>
      <div style={{ fontSize: 11, lineHeight: 1.6, color: C.inkSoft, marginBottom: 12 }}>
        {lang === 'pt'
          ? 'Desktop: use uma fotografia com pelo menos 2560 px de largura, se possível. O recorte adapta-se ao ecrã; deixe espaço para o texto à esquerda. O mobile mantém o seu recorte separado, com o texto na parte inferior.'
          : 'Desktop: use a photo at least 2560 px wide when possible. The crop adapts to the screen; leave room for text on the left. Mobile keeps its separate crop, with text at the bottom.'}
      </div>
      {heroImageUrl && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.ink, marginBottom: 6 }}>
            {lang === 'pt' ? 'Composição em ecrã grande — pré-visualização aproximada' : 'Large-screen composition — approximate preview'}
          </div>
          <div style={{ position: 'relative', aspectRatio: '16 / 9', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', borderRadius: 8, background: '#050505' }}>
            <img src={heroImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroPosition(content, 'desktop') }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,5,5,.76) 0%, rgba(5,5,5,.5) 32%, rgba(5,5,5,.08) 68%), linear-gradient(0deg, rgba(5,5,5,.28), transparent 50%)' }} />
            <div style={{ position: 'relative', width: '58%', padding: '6%', color: '#fff' }}>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#E5C24F', fontWeight: 800, marginBottom: 6 }}>{(lang === 'pt' ? content.heroEyebrowPT : content.heroEyebrowEN) || content.heroEyebrowPT}</div>
              <div style={{ fontSize: 20, lineHeight: 1.08, fontWeight: 800, marginBottom: 8 }}>{(lang === 'pt' ? content.heroHeadlinePT : content.heroHeadlineEN) || content.heroHeadlinePT}</div>
              <div style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 10 }}>{(lang === 'pt' ? content.heroSubtitlePT : content.heroSubtitleEN) || content.heroSubtitlePT}</div>
              <span style={{ display: 'inline-block', background: '#E5C24F', color: '#050505', padding: '7px 10px', borderRadius: 4, fontSize: 8, fontWeight: 800 }}>{(lang === 'pt' ? content.heroCtaLabelPT : content.heroCtaLabelEN) || content.heroCtaLabelPT}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
