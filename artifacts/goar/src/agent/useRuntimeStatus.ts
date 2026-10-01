import { useCallback, useEffect, useRef, useState } from 'react';
import { initialSnapshot, readRuntimeSnapshot, type RuntimeSnapshot } from './runtime-dom';

export function useRuntimeStatus() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const timerRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(initialSnapshot);
  const [timedOut, setTimedOut] = useState(false);
  const [generation, setGeneration] = useState(0);

  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const onLoad = useCallback(() => {
    disconnect();
    setTimedOut(false);
    let document: Document | null | undefined;
    try { document = frameRef.current?.contentDocument; } catch { /* surfaced below */ }
    if (!document?.body || !document.getElementById('setup')) {
      setSnapshot({ ...initialSnapshot, phase: 'error', bootError: 'The supplied agent document did not load. Open the standalone service or retry.' });
      return;
    }
    const update = () => {
      const next = readRuntimeSnapshot(document!);
      setSnapshot(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
      if (next.phase === 'ready' || next.phase === 'error' || next.phase === 'setup') {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = null;
        setTimedOut(false);
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style', 'aria-hidden'], characterData: true });
    observerRef.current = observer;
    timerRef.current = window.setTimeout(() => {
      if (readRuntimeSnapshot(document!).phase === 'loading') setTimedOut(true);
    }, 60000);
  }, [disconnect]);

  const restart = useCallback(() => {
    disconnect();
    setSnapshot(initialSnapshot);
    setTimedOut(false);
    setGeneration(current => current + 1);
  }, [disconnect]);

  useEffect(() => disconnect, [disconnect]);
  return { frameRef, snapshot, timedOut, generation, onLoad, restart };
}