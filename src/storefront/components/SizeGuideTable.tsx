import { C, t, type Lang } from '../../theme';
import type { SizeGuideRow } from '../../types/product';

export function SizeGuideTable({ rows, lang, fitNote }: { rows: SizeGuideRow[]; lang: Lang; fitNote?: string }) {
  const columns = (['bust', 'waist', 'hip', 'length'] as const).filter((key) => rows.some((row) => row[key] != null));
  const columnLabel = { bust: 'sgBust', waist: 'sgWaist', hip: 'sgHip', length: 'sgLength' } as const;

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '9px 0', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase' }}>{t('size', lang)}</th>
              {columns.map((key) => (
                <th key={key} style={{ textAlign: 'right', padding: '9px 0 9px 16px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {t(columnLabel[key], lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size} style={{ borderTop: `1px solid ${C.ruleLight}` }}>
                <td style={{ padding: '10px 0', fontWeight: 700, color: C.ink }}>{row.size}</td>
                {columns.map((key) => (
                  <td key={key} style={{ padding: '10px 0 10px 16px', textAlign: 'right', color: C.inkSoft, whiteSpace: 'nowrap' }}>
                    {row[key] != null ? `${row[key]} cm` : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fitNote && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.ruleLight}`, fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>{fitNote}</div>}
    </>
  );
}
