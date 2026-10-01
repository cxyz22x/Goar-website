import { Link } from 'wouter';
import { docLinks, mediaViews, serviceLinks } from '../data/content';

export function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <span>© 2026 Goar</span>
        {docLinks.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
        {serviceLinks.map((s) => s.internal ? <Link key={s.href} href={s.href}>{s.label}</Link> : <a key={s.href} href={s.href}>{s.label}</a>)}
        {mediaViews.map((m) => <a key={m.href} href={m.href}>{m.label}</a>)}
        <span className="sp">No cookies. No trackers.</span>
      </div>
    </footer>
  );
}
