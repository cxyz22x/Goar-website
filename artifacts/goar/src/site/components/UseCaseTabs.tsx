import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cases } from '../data/cases';
import { UseCasePanel } from './UseCasePanel';

export function UseCaseTabs() {
  const [sel, setSel] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (i: number) => { setSel(i); refs.current[i]?.focus(); };
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = cases.length;
    const t = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (t >= 0) { e.preventDefault(); go(t); }
  };
  return (
    <section className="section" id="uses">
      <div className="section-head"><h2>Choose the work you need to do.</h2><p>Examples of how Goar’s tools can fit into a personal project, a small business or a team.</p></div>
      <div className="tabs" role="tablist" aria-label="Use cases">
        {cases.map((c, i) => (
          <button key={c.id} ref={(el) => { refs.current[i] = el; }} className="tab" role="tab" id={`tab-${c.id}`} aria-selected={sel === i} aria-controls={c.id} tabIndex={sel === i ? 0 : -1} onClick={() => setSel(i)} onKeyDown={(e) => onKey(e, i)} data-testid={`tab-${c.id}`}>{c.tab}</button>
        ))}
      </div>
      {cases.map((c, i) => <UseCasePanel key={c.id} c={c} selected={sel === i} />)}
    </section>
  );
}
