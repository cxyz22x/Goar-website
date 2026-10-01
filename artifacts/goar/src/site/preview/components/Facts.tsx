import { facts } from '../data/content';

export function Facts() {
  return (
    <section className="band">
      <div className="wrap facts">
        {facts.map(([t, d]) => <div className="fact" key={t}><strong>{t}</strong><span>{d}</span></div>)}
      </div>
    </section>
  );
}
