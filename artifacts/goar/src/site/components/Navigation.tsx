import { Link, useLocation } from 'wouter';
import { BASE } from '../data/content';

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const [loc] = useLocation();
  return (
    <nav className="nav" id="site-nav" aria-label="Primary" onClick={onNavigate}>
      <a href={BASE}>Overview</a>
      <Link href="/agent" aria-current={loc === '/agent' ? 'page' : undefined} data-testid="link-agent">Agent</Link>
      <a href={`${BASE}pages/watch/index.html?tab=movie`} data-testid="link-watch">Watch</a>
      <a href={`${BASE}pages/music/index.html`} data-testid="link-music">Music</a>
      <a href={`${BASE}pages/games/index.html`} data-testid="link-games">Games</a>
      <a href={`${BASE}pages/live/index.html`} data-testid="link-live">Live</a>
      <a href={`${BASE}pages/anime/index.html`} data-testid="link-anime">Anime</a>
    </nav>
  );
}
