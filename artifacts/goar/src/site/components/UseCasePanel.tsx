import type { UseCase } from '../data/cases';
import { UseCaseWorkflow } from './UseCaseWorkflow';

export function UseCasePanel({ c, selected }: { c: UseCase; selected: boolean }) {
  return (
    <div className="case" id={c.id} role="tabpanel" aria-labelledby={`tab-${c.id}`} hidden={!selected}>
      <div><p className="eyebrow">{c.eye}</p><h3>{c.h}</h3><p>{c.p}</p><p className="note">{c.n}</p></div>
      <UseCaseWorkflow steps={c.s} />
    </div>
  );
}
