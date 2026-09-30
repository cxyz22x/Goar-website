import { type ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import './site.css';

export const BASE = import.meta.env.BASE_URL;
export const RUNTIME = `${BASE}workspace/index.html`;

export function Layout({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc]);
  return (
    <div className="g">
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <Link href="/" className="brand" data-testid="link-home"><img src={`${BASE}brand.png`} alt="" />Goar</Link>
        <nav className="nav" aria-label="Primary">
          <a href={`${BASE}#uses`}>Use cases</a>
          <a href={`${BASE}#android`}>On Android</a>
          <a href={`${BASE}#control`}>Your data</a>
          <Link href="/launch" className="btn" data-testid="link-launch">Try the browser demo</Link>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="foot">
        <span>Goar · Android AI workspace</span>
        <div className="fl">
          <Link href="/privacy.html">Privacy</Link><Link href="/terms.html">Terms</Link><Link href="/license.html">Licence</Link>
          <Link href="/data-safety.html">Data safety</Link><Link href="/contact.html">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
