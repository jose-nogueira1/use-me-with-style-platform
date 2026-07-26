import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { t } from '../i18n';

const PHASES = [
  {
    labelKey: 'phase1Ongoing',
    itemKeys: ['roadmapPhase1Item1', 'roadmapPhase1Item2', 'roadmapPhase1Item3', 'roadmapPhase1Item4', 'roadmapPhase1Item5'],
  },
  {
    labelKey: 'phase2Planned',
    itemKeys: ['roadmapPhase2Item1', 'roadmapPhase2Item2', 'roadmapPhase2Item3', 'roadmapPhase2Item4'],
  },
  {
    labelKey: 'phase3Planned',
    itemKeys: ['roadmapPhase3Item1', 'roadmapPhase3Item2', 'roadmapPhase3Item3'],
  },
] as const;

export function Roadmap() {
  const { lang } = useApp();
  return (
    <div style={{ padding: '32px 36px', maxWidth: 640 }}>
      <div style={{ fontFamily: F.display, fontSize: 28, color: C.ink, marginBottom: 20 }}>{t('roadmapTitle', lang)}</div>
      {PHASES.map((phase) => (
        <div key={phase.labelKey} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.goldDeep, marginBottom: 8 }}>{t(phase.labelKey, lang)}</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {phase.itemKeys.map((key) => (
              <li key={key} style={{ fontSize: 13, color: C.inkSoft, marginBottom: 4, lineHeight: 1.5 }}>
                {t(key, lang)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
