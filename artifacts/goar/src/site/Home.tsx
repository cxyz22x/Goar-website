import { useEffect } from 'react';
import './preview/components/index';
import { useTheme } from './preview/data/useTheme';
import { GoarLanding } from './preview/components/GoarLanding';

const TITLE = 'Goar — one system on this phone';

export default function Home() {
  const { theme, toggle, rootRef } = useTheme();
  useEffect(() => {
    const prev = document.title;
    document.title = TITLE;
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, []);
  return <GoarLanding theme={theme ?? 'dark'} onTheme={toggle} rootRef={rootRef} />;
}
