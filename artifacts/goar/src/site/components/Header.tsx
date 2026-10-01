import { useState } from 'react';
import { Link } from 'wouter';
import { Navigation } from './Navigation';

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className={open ? 'open' : undefined}>
      <div className="header-inner">
        <Link href="/" className="brand" data-testid="link-home">Goar</Link>
        <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(o => !o)} data-testid="button-menu">{open ? 'Close' : 'Menu'}</button>
        <Navigation onNavigate={() => setOpen(false)} />
      </div>
    </header>
  );
}
