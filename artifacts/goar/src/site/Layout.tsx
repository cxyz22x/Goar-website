import { type ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import './styles/base.css';
import './styles/layout.css';
import './styles/pages.css';

export { BASE } from './data/content';

export function Layout({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc]);
  return (
    <div className="g">
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <div className="section" style={{ paddingBottom: 0, paddingTop: '1.2rem', maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/" className="backlink" data-testid="link-back-overview">← Back to overview</Link>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
