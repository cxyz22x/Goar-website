import { Link } from 'wouter';
import { services } from '../data/content';

export function ServiceConnections() {
  return (
    <section className="section" id="services">
      <div className="section-head"><h2>Connected services.</h2><p>Goar is the Android app. These are separate pages and services connected to this site.</p></div>
      <dl className="services">
        {services.map((s) => (
          <div className="feature" key={s.id}>
            <dt>{s.internal ? <Link href={s.href} data-testid={`link-service-${s.id}`}>{s.title}</Link> : <a href={s.href} data-testid={`link-service-${s.id}`}>{s.title}</a>}</dt>
            <dd>{s.text}</dd>
          </div>
        ))}
      </dl>
      <p className="note">The Agent is a free browser try-it service, not Goar. Use its supplied Default SSH preset or your own authorised connection. Provider limits apply; free or unlimited compute is not guaranteed.</p>
    </section>
  );
}
