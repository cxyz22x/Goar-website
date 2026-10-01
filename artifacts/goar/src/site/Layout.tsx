import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import './styles/base.css';
import './styles/layout.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/pages.css';

export { BASE } from './data/content';

export function Layout({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc]);
  return (
    <div className="g">
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
