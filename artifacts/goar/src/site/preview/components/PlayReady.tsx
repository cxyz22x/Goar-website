import { Link } from 'wouter';
import { policies } from '../data/content';

export function PlayReady() {
  return (
    <section className="wrap">
      <h2 className="section-title">Play-ready, F-Droid honest.</h2>
      <p className="section-copy">Package <code>app.goar</code>. Android 8+, arm64-v8a. Cloud backup is off. Legal documents ship in the APK and on this site.</p>
      <div className="grid">
        {policies.map(([t, d, h, l]) => (
          <article className="card" key={t}>
            <h3>{t}</h3>
            <p>{d}</p>
            <p><Link className="pill ghost" href={h} style={{ marginTop: '1rem' }} data-testid={`link-policy-${h.slice(1, -5)}`}>{l}</Link></p>
          </article>
        ))}
      </div>
    </section>
  );
}
