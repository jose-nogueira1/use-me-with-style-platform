import { ChevronDown } from 'lucide-react';
import { C } from '../../theme';

export function Disclosure({ id, heading, open, onToggle, children, disabled = false }: {
  id: string;
  heading: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <details open={open} style={{ borderBottom: `1px solid ${C.rule}` }}>
      <summary className="ump-disclosure-button" onClick={(event) => { event.preventDefault(); if (!disabled) onToggle(); }} aria-controls={id}>
        <span>{heading}</span><ChevronDown className="ump-disclosure-icon" size={18} aria-hidden />
      </summary>
      {open && <div id={id} style={{ padding: '0 4px 20px', color: C.inkSoft, fontSize: 13, lineHeight: 1.75 }}>{children}</div>}
    </details>
  );
}
