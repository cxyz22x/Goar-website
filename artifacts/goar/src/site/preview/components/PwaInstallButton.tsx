import { useEffect, useRef, useState } from 'react';

type InstallOutcome = 'accepted' | 'dismissed';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform?: string }>;
}

function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInstalled(isRunningStandalone());
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!showInstructions) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowInstructions(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      buttonRef.current?.focus();
    };
  }, [showInstructions]);

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === 'accepted') setInstalled(true);
  };

  return (
    <>
      <div className="pwa-install-control">
        <button
          ref={buttonRef}
          className="pwa-install-trigger"
          type="button"
          onClick={() => { void install(); }}
          disabled={installed}
          aria-label={installed ? 'Goar is installed' : 'Install the Goar website'}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="M10 2.5v9m0 0 3.5-3.5M10 11.5 6.5 8M3.5 13v3.5h13V13" />
          </svg>
          <span>{installed ? 'Installed' : 'Install'}</span>
        </button>
      </div>

      {showInstructions && (
        <div
          className="pwa-install-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowInstructions(false);
          }}
        >
          <section
            className="pwa-install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            aria-describedby="pwa-install-description"
          >
            <div className="pwa-install-dialog-header">
              <span className="pwa-install-mark"><img src={`${import.meta.env.BASE_URL}brand.png`} alt="" /></span>
              <button
                ref={closeRef}
                className="pwa-install-close"
                type="button"
                onClick={() => setShowInstructions(false)}
                aria-label="Close installation instructions"
              >
                ×
              </button>
            </div>
            <h2 id="pwa-install-title">Add Goar to your device</h2>
            <p id="pwa-install-description">
              Install this website for app-like access. It is separate from the native Goar Android app.
            </p>
            <p className="pwa-install-steps">
              In your browser menu, choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
              On iPhone or iPad, use Share, then Add to Home Screen.
            </p>
          </section>
        </div>
      )}
    </>
  );
}