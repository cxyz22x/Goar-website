import { Link, useLocation } from 'wouter';
import { BASE } from '../data/content';

const media = (view: string) => `${BASE}media/index.html?view=${view}`;

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const [loc] = useLocation();
  return (
    <nav className="nav" id="site-nav" aria-label="Primary" onClick={onNavigate}>
      <a href={BASE}>Overview</a>
      <Link href="/agent" aria-current={loc === '/agent' ? 'page' : undefined} data-testid="link-agent">Agent</Link>
      <a href={media('watch')} data-testid="link-watch">Watch</a>
      <a href={media('music')} data-testid="link-music">Music</a>
      <a href={media('games')} data-testid="link-games">Games</a>
    </nav>
  );
}
