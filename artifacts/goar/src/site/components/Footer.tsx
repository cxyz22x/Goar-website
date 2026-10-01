import { Link } from 'wouter';
import { BASE, footerLinks } from '../data/content';

export function Footer() {
  return (
    <footer>
      <span>Goar · Android AI workspace</span>
      <div className="footer-links">
        <Link href="/agent">Agent</Link>
        <a href={`${BASE}pages/watch/index.html?tab=movie`}>Watch</a>
        <a href={`${BASE}pages/music/index.html`}>Music</a>
        <a href={`${BASE}pages/games/index.html`}>Games</a>
        <a href={`${BASE}pages/live/index.html`}>Live</a>
        <a href={`${BASE}pages/anime/index.html`}>Anime</a>
        {footerLinks.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
      </div>
    </footer>
  );
}
