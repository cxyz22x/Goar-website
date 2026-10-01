import { useState } from 'react';
import { Link } from 'wouter';
import { docLinks, serviceLinks } from '../data/content';

export function Header({ onTheme }: { onTheme: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={open ? 'nav open' : 'nav'}>
      <div className="wrap nav-inner">
        <Link className="brand" href="/" data-testid="link-home"><span className="brand-mark" aria-hidden="true" />Goar</Link>
        <button className="nav-toggle" type="button" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)} data-testid="button-menu">Menu</button>
        <nav className="nav-links" aria-label="Primary">
          <Link href="/" aria-current="page">Product</Link>
          {docLinks.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
          {serviceLinks.map((s) => s.internal
            ? <Link key={s.href} href={s.href} data-testid={`link-nav-${s.label.toLowerCase()}`}>{s.label}</Link>
            : <a key={s.href} href={s.href} data-testid={`link-nav-${s.label.toLowerCase()}`}>{s.label}</a>)}
          <button className="theme-btn" type="button" aria-label="Toggle light and dark" onClick={onTheme} data-testid="button-theme">◐</button>
        </nav>
      </div>
    </header>
  );
}
