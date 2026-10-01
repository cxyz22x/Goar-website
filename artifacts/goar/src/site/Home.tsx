import { useEffect } from 'react';
import './preview/components/index';
import { useTheme } from './preview/data/useTheme';
import { Header } from './preview/components/Header';
import { Hero } from './preview/components/Hero';
import { Facts } from './preview/components/Facts';
import { Surfaces } from './preview/components/Surfaces';
import { PlayReady } from './preview/components/PlayReady';
import { Footer } from './preview/components/Footer';
import { appSchema } from './preview/data/schema';

const TITLE = 'Goar — one system on this phone';

export default function Home() {
  const { theme, toggle, rootRef } = useTheme();
  useEffect(() => {
    const prev = document.title;
    document.title = TITLE;
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, []);
  return (
    <div className="gp" ref={rootRef} data-theme={theme ?? undefined}>
      <script type="application/ld+json">{JSON.stringify(appSchema)}</script>
      <a className="skip" href="#main">Skip to content</a>
      <Header onTheme={toggle} />
      <main id="main">
        <Hero />
        <Facts />
        <Surfaces />
        <PlayReady />
      </main>
      <Footer />
    </div>
  );
}
