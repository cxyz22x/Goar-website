import { Link } from 'wouter';
import { Navigation } from './Navigation';

export function Header() {
  return (
    <header>
      <Link href="/" className="brand" data-testid="link-home">Goar</Link>
      <Navigation />
    </header>
  );
}
