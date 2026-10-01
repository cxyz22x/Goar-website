import { Link } from 'wouter';
import { footerLinks } from '../data/content';

export function Footer() {
  return (
    <footer>
      <span>Goar · Android AI workspace · <Link href="/connections">Connected services</Link></span>
      <div className="footer-links">
        <Link href="/agent">Agent</Link>
        {footerLinks.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
      </div>
    </footer>
  );
}
