import { Link } from 'wouter';
import { BASE } from '../data/content';

export function Navigation() {
  return (
    <nav className="nav" aria-label="Primary">
      <a href={`${BASE}#uses`}>Use cases</a>
      <a href={`${BASE}#control`}>Your data</a>
      <a href={`${BASE}#get`}>Availability</a>
      <Link href="/connections" data-testid="link-connections">Connections</Link>
      <Link href="/agent" data-testid="link-agent">Agent</Link>
    </nav>
  );
}
