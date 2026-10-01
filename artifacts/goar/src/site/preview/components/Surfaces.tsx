import { surfaces } from '../data/content';

export function Surfaces() {
  return (
    <section className="wrap">
      <h2 className="section-title">The same surfaces as the APK.</h2>
      <p className="section-copy">One session. Destinations do not stack. Ink and bone, never purple, never a pure white fill.</p>
      <div className="grid">
        {surfaces.map(([t, d]) => <article className="card" key={t}><h3>{t}</h3><p>{d}</p></article>)}
      </div>
    </section>
  );
}
