import { Link } from 'wouter';
import { BASE, footerLinks } from '../data/content';

export function Footer() {
  return (
    <footer>
      <span>Goar · Android AI workspace</span>
      <div className="footer-links">
        <Link href="/agent">Agent</Link>
        <a href={`${BASE}media/index.html?view=watch`}>Watch</a>
        <a href={`${BASE}media/index.html?view=music`}>Music</a>
        <a href={`${BASE}media/index.html?view=games`}>Games</a>
        {footerLinks.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
      </div>
    </footer>
  );
}
