import { useEffect, useRef, useState } from 'react';
import './GoarLanding.css';

const THEME_KEY = 'goar-theme';
const BASE = '/';

const docLinks = [
  ['/privacy.html', 'Privacy'],
  ['/terms.html', 'Terms'],
  ['/license.html', 'License'],
  ['/data-safety.html', 'Data safety'],
  ['/contact.html', 'Contact'],
] as const;

const serviceLinks = [
  { href: '/agent', label: 'Agent', internal: true },
  { href: `${BASE}pages/watch/index.html?tab=movie`, label: 'Watch', internal: false },
  { href: `${BASE}pages/music/index.html`, label: 'Music', internal: false },
  { href: `${BASE}pages/games/index.html`, label: 'Games', internal: false },
  { href: `${BASE}pages/live/index.html`, label: 'Live', internal: false },
  { href: `${BASE}pages/anime/index.html`, label: 'Anime', internal: false },
] as const;

const mediaViews = [
  { href: `${BASE}pages/watch/index.html?tab=movie`, label: 'Watch' },
  { href: `${BASE}pages/music/index.html`, label: 'Music' },
  { href: `${BASE}pages/games/index.html`, label: 'Games' },
  { href: `${BASE}pages/live/index.html`, label: 'Live' },
  { href: `${BASE}pages/anime/index.html`, label: 'Anime' },
] as const;

const surfaces = [
  {
    title: 'Chat',
    detail: 'The operator loop. Tools, memory, skills, and Computer live in the conversation. Composer is a pill: attach, type, send.',
    number: '01',
    short: 'Ask, direct, inspect.',
  },
  {
    title: 'Files & Notes',
    detail: 'Browse SSH or the on-device sandbox. Search, upload, zip and rar, a notes editor, a code editor. Git clone lives here.',
    number: '02',
    short: 'Keep the work close.',
  },
  {
    title: 'Computer',
    detail: 'Live VNC of a Linux desktop. SSH is only a pipe to 127.0.0.1:5901 unless you open the port. You set port, size, and password in Settings → Computer.',
    number: '03',
    short: 'See the desktop live.',
  },
  {
    title: 'Terminal',
    detail: 'Shell on the sandbox or a host you pin. Jobs on SSH keep running if the phone sleeps. The agent does not move onto the VPS.',
    number: '04',
    short: 'Run commands where they belong.',
  },
  {
    title: 'Browser',
    detail: 'One in-app browser the operator and the agent share. You choose search and fetch endpoints.',
    number: '05',
    short: 'Browse on your terms.',
  },
  {
    title: 'Creative',
    detail: 'Stills, edits, video through providers you enable. Pollinations stills need no key. Video and edits do.',
    number: '06',
    short: 'Make with providers you choose.',
  },
] as const;

const facts = [
  ['No account', 'Nothing is sent to a Goar server. There isn’t one.'],
  ['No telemetry', 'No analytics, ads, crash phones-home, or update checkers.'],
  ['Your keys', 'Providers, SSH, and MCP URLs are yours. Stored on-device.'],
  ['Your machines', 'Sandbox on the phone, or SSH to a VPS. Separate disks.'],
] as const;

const policies = [
  ['Privacy policy', 'What stays on device, what leaves only because you sent it, and how to delete data.', '/privacy.html', 'Read privacy'],
  ['Terms & licence', 'You are responsible for keys and hosts you attach. MIT licence. No warranty.', '/terms.html', 'Read terms'],
  ['Data safety', 'Mapped to the Play Data safety form: we collect nothing. Third parties are only the ones you configure.', '/data-safety.html', 'Data safety'],
] as const;

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Goar',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Android',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  isAccessibleForFree: true,
};

function readTheme(): 'light' | 'dark' {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage may be unavailable in a restricted preview.
  }
  return 'dark';
}

function Mark({ className = '' }: { className?: string }) {
  return <span className={`goar-mark ${className}`} aria-hidden="true"><i /><i /></span>;
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={diagonal ? 'goar-arrow diagonal' : 'goar-arrow'}>
      <path d={diagonal ? 'M5 15 15 5M6 5h9v9' : 'M3.5 10h12m-4.5-4.5 4.5 4.5-4.5 4.5'} />
    </svg>
  );
}

type NavPanel = 'android' | 'web' | 'about';

function Header({ theme, onTheme }: { theme: 'light' | 'dark'; onTheme: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<NavPanel | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Record<NavPanel, HTMLButtonElement | null>>({
    android: null,
    web: null,
    about: null,
  });
  const closeNavigation = () => {
    setOpenPanel(null);
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen && !openPanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (openPanel) {
        const closingPanel = openPanel;
        setOpenPanel(null);
        triggerRefs.current[closingPanel]?.focus();
      } else if (menuOpen) {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, openPanel]);

  const panels: { id: NavPanel; label: string; title: string }[] = [
    { id: 'android', label: 'Android app', title: 'Native Android app' },
    { id: 'web', label: 'Web experiences', title: 'Separate web destinations' },
    { id: 'about', label: 'About', title: 'About Goar' },
  ];

  return (
    <header className={`goar-header${menuOpen ? ' menu-open' : ''}`}>
      <div className="goar-shell header-row">
        <a className="goar-brand" href="/" aria-label="Goar home" onClick={closeNavigation}>
          <Mark />
          <span>goar</span>
        </a>
        <button
          className="mobile-menu-toggle"
          type="button"
          ref={menuToggleRef}
          aria-expanded={menuOpen}
          aria-controls="goar-primary-nav"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => {
            setMenuOpen((value) => !value);
            setOpenPanel(null);
          }}
        >
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
          <span className="menu-glyph" aria-hidden="true"><i /><i /></span>
        </button>
        <nav className="goar-nav" id="goar-primary-nav" aria-label="Primary navigation">
          {panels.map(({ id, label, title }) => (
            <div className={`nav-disclosure nav-disclosure-${id}`} key={id}>
              <button
                className={`nav-disclosure-trigger${openPanel === id ? ' is-open' : ''}`}
                type="button"
                ref={(node) => { triggerRefs.current[id] = node; }}
                aria-label={`${label} navigation`}
                aria-expanded={openPanel === id}
                aria-controls={`nav-panel-${id}`}
                onClick={() => setOpenPanel((current) => current === id ? null : id)}
              >
                <span>{label}</span><span className="nav-chevron" aria-hidden="true" />
              </button>
              <div className="nav-panel" id={`nav-panel-${id}`} hidden={openPanel !== id}>
                <p className="nav-panel-title">{title}</p>
                {id === 'android' && (
                  <a className="nav-panel-link nav-home-link" href="/" aria-current="page" onClick={closeNavigation}>
                    <span>Product home</span><small>Goar on your phone</small>
                  </a>
                )}
                {id === 'web' && serviceLinks.map((service) => (
                  <a
                    className="nav-panel-link nav-web-link"
                    href={service.href}
                    key={service.href}
                    data-testid={`link-nav-${service.label.toLowerCase()}`}
                    onClick={closeNavigation}
                  >
                    <span>{service.label}</span><small>Separate web page</small><b>WEB</b>
                  </a>
                ))}
                {id === 'about' && docLinks.map(([href, label]) => (
                  <a className="nav-panel-link" href={href} key={href} onClick={closeNavigation}>{label}</a>
                ))}
              </div>
            </div>
          ))}
          <button className="theme-toggle" type="button" onClick={onTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            <span className={`theme-glyph ${theme}`} aria-hidden="true"><i /></span>
            <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

function HeroDevice() {
  return (
    <div className="hero-art" role="img" aria-label="Illustration of a Goar session on an Android phone">
      <div className="art-orbit orbit-one" aria-hidden="true" />
      <div className="art-orbit orbit-two" aria-hidden="true" />
      <div className="device-caption caption-top"><span className="status-dot" /> LOCAL SESSION <span>01 / 01</span></div>
      <div className="phone-frame">
        <div className="phone-camera" aria-hidden="true" />
        <div className="phone-ui">
          <div className="phone-status"><span>9:41</span><span>● ◧ ▮</span></div>
          <div className="phone-appbar"><Mark className="small-mark" /><strong>Goar</strong><span>local</span></div>
          <div className="phone-thread">
            <div className="phone-date">TODAY · SANDBOX</div>
            <div className="phone-user">Clone the repo, start the desktop, and show me the running app.</div>
            <div className="phone-tool"><span className="tool-symbol">↳</span><span>COMPUTER · FILES · SHELL</span><i /></div>
            <div className="phone-answer">Imported into <code>~/projects</code>.<br />VNC is live on the loopback pipe. Chromium is up.</div>
            <div className="phone-answer secondary-answer">Watch is view-only. Take over when the login screen appears.</div>
          </div>
          <div className="phone-composer"><span>Ask Goar</span><span className="composer-plus">＋</span><b>↑</b></div>
          <div className="phone-homebar" />
        </div>
      </div>
      <div className="device-caption caption-bottom"><span>ANDROID / ARM64</span><span>YOUR DEVICE, YOUR SESSION</span></div>
      <div className="art-side-note" aria-hidden="true">THE OPERATOR STAYS HERE</div>
    </div>
  );
}

function Hero() {
  return (
    <section className="goar-hero goar-shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" /> A LOCAL-FIRST AI WORKBENCH FOR ANDROID</p>
        <h1 id="hero-title">Your tools.<br /><em>Your keys.</em><br />Your phone.</h1>
        <p className="hero-lede">Chat, files, terminal, browser, and a live desktop—together on your Android. Bring the model keys and machines you trust. The agent stays on the device.</p>
        <div className="hero-actions">
          <a className="action-primary" href="/contact.html">Contact &amp; Play listing <Arrow /></a>
          <a className="action-text" href="#how-it-works">See how it works <Arrow /></a>
        </div>
        <div className="hero-proof"><span className="mini-lock" aria-hidden="true" /> No Goar account <span className="proof-sep">/</span> No analytics <span className="proof-sep">/</span> No cloud agent</div>
      </div>
      <HeroDevice />
      <div className="hero-index" aria-hidden="true"><span>01</span><i /> A different kind of assistant</div>
    </section>
  );
}

function PrivacyStrip() {
  return (
    <section className="privacy-strip" aria-label="Goar privacy principles">
      <div className="goar-shell privacy-strip-inner">
        <div className="strip-intro"><span className="eyebrow">BUILT AROUND YOUR BOUNDARIES</span><p>Private by architecture.<br /><strong>Not by promise.</strong></p></div>
        <div className="fact-list">
          {facts.map(([title, detail], index) => (
            <article className="fact-item" key={title}>
              <span className="fact-number">0{index + 1}</span>
              <div><h2>{title}</h2><p>{detail}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkbenchSection() {
  const [activeSurface, setActiveSurface] = useState(0);
  const current = surfaces[activeSurface];
  return (
    <section className="workbench-section" id="how-it-works" aria-labelledby="workbench-title">
      <div className="goar-shell">
        <div className="section-head workbench-head">
          <div>
            <p className="eyebrow"><span className="section-index">02</span> ONE OPERATOR LOOP</p>
            <h2 id="workbench-title">A whole workspace.<br /><em>Without the cloud layer.</em></h2>
          </div>
          <p className="section-intro">Goar brings the work surfaces into one Android app. Choose a surface to see where the work happens.</p>
        </div>
        <div className="workbench">
          <div className="surface-rail" role="group" aria-label="Explore Goar work surfaces">
            {surfaces.map((surface, index) => (
              <button
                key={surface.title}
                type="button"
                className={`surface-choice${activeSurface === index ? ' selected' : ''}`}
                aria-pressed={activeSurface === index}
                onClick={() => setActiveSurface(index)}
              >
                <span className="surface-num">{surface.number}</span>
                <span className="surface-label">{surface.title}</span>
                <span className="surface-spark" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <article className="surface-detail" aria-live="polite" aria-atomic="true">
            <div className="surface-detail-top"><span>GOAR / SURFACE {current.number}</span><span className="surface-online"><i /> ON DEVICE</span></div>
            <div className="surface-detail-copy">
              <span className="surface-overline">{current.short}</span>
              <h3>{current.title}<span>.</span></h3>
              <p>{current.detail}</p>
            </div>
            <div className="surface-console">
              <div className="console-top"><span><i /><i /><i /></span><span>SESSION / LOCAL</span><span>•••</span></div>
              <div className="console-body">
                <span className="console-line-no">01</span><span className="console-prompt">goar</span><span className="console-command">— tools, context, and your next move</span>
                <span className="console-line-no">02</span><span className="console-prompt">↳</span><span className="console-output">Connected only to what you configure.</span>
                <span className="console-line-no">03</span><span className="console-cursor" aria-label="Ready" />
              </div>
            </div>
            <div className="surface-note"><span>01—06</span> Destinations do not stack. One session at a time.</div>
          </article>
        </div>
      </div>
    </section>
  );
}

function OwnershipSection() {
  return (
    <section className="ownership-section" aria-labelledby="ownership-title">
      <div className="goar-shell ownership-layout">
        <div className="ownership-statement">
          <p className="eyebrow"><span className="section-index">03</span> THE IMPORTANT DISTINCTION</p>
          <h2 id="ownership-title">Your agent is<br /><em>not your server.</em></h2>
          <p>Goar runs on your Android device. Your sandbox lives on the phone; an SSH connection can reach a VPS you choose. The agent does not move onto that VPS.</p>
          <a className="action-text" href="/data-safety.html">Understand the data flow <Arrow /></a>
        </div>
        <div className="architecture" aria-label="Goar connection model">
          <div className="architecture-device">
            <div className="arch-tag"><span className="status-dot" /> ON YOUR PHONE</div>
            <Mark className="architecture-mark" />
            <strong>Goar agent</strong>
            <span>Chat · tools · memory</span>
            <div className="arch-local">Local sandbox</div>
          </div>
          <div className="arch-connectors" aria-hidden="true">
            <div><i /><span>SSH</span><i /></div>
            <div><i /><span>YOUR KEYS</span><i /></div>
            <div><i /><span>MCP URLS</span><i /></div>
          </div>
          <div className="architecture-host">
            <div className="arch-tag">YOU CONFIGURE</div>
            <div className="host-icon" aria-hidden="true"><span /><span /><span /></div>
            <strong>Your hosts</strong>
            <span>SSH · providers · endpoints</span>
            <div className="arch-local host-local">Separate disks</div>
          </div>
          <p className="architecture-foot">Nothing connects until you configure it.</p>
        </div>
      </div>
    </section>
  );
}

function MediaSection() {
  return (
    <section className="media-section" aria-labelledby="media-title">
      <div className="goar-shell media-layout">
        <div className="media-heading">
          <p className="eyebrow"><span className="section-index">04</span> ANOTHER PART OF GOAR</p>
          <h2 id="media-title">Good to know:<br /><em>these are separate.</em></h2>
          <p>The browser agent is a website destination. Watch, Music, Games, Live, and Anime are separate web pages—not capabilities of the native Android app.</p>
        </div>
        <div className="media-list">
          {mediaViews.map((item, index) => (
            <a className="media-link" href={item.href} key={item.href}>
              <span className="media-number">0{index + 1}</span>
              <span>{item.label}</span>
              <span className="media-link-note">SEPARATE WEB PAGE</span>
              <Arrow diagonal />
            </a>
          ))}
          <a className="agent-destination" href="/agent"><span className="agent-destination-mark"><Mark /></span><span><small>ALSO ON THE WEB</small><strong>Browser agent</strong></span><span className="agent-destination-copy">Separate from the Android app.</span><Arrow diagonal /></a>
        </div>
      </div>
    </section>
  );
}

function ReadinessSection() {
  return (
    <section className="readiness-section" aria-labelledby="readiness-title">
      <div className="goar-shell readiness-layout">
        <div className="readiness-copy">
          <p className="eyebrow"><span className="section-index">05</span> BEFORE YOU BEGIN</p>
          <h2 id="readiness-title">Bring the parts<br />that are <em>yours.</em></h2>
          <p>Goar is free, open, and built for Android. You bring your provider keys and hosts; Goar supplies the workbench on your phone.</p>
          <a className="action-primary" href="/contact.html">Contact &amp; Play listing <Arrow /></a>
        </div>
        <div className="readiness-spec">
          <div className="spec-row"><span>PACKAGE</span><code>app.goar</code></div>
          <div className="spec-row"><span>PLATFORM</span><strong>Android 8+</strong></div>
          <div className="spec-row"><span>ARCHITECTURE</span><strong>arm64-v8a</strong></div>
          <div className="spec-row"><span>ACCOUNT</span><strong>Not required</strong></div>
          <div className="spec-row"><span>CLOUD BACKUP</span><strong>Off</strong></div>
          <p>Legal documents ship in the APK and are available on this site.</p>
        </div>
      </div>
    </section>
  );
}

function PolicySection() {
  return (
    <section className="policy-section goar-shell" aria-labelledby="policy-title">
      <div className="section-head policy-heading">
        <div><p className="eyebrow"><span className="section-index">06</span> READ BEFORE CONNECTING</p><h2 id="policy-title">Clear terms.<br /><em>No fine print theatre.</em></h2></div>
        <p className="section-intro">Know what stays local, what you configure, and what you are responsible for.</p>
      </div>
      <div className="policy-list">
        {policies.map(([title, detail, href, label], index) => (
          <article className="policy-item" key={href}>
            <span className="policy-num">0{index + 1}</span>
            <div className="policy-copy"><h3>{title}</h3><p>{detail}</p></div>
            <a href={href} aria-label={`${label}: ${title}`}>{label}<Arrow /></a>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="goar-footer">
      <div className="goar-shell footer-top">
        <div className="footer-brand-lockup"><a className="goar-brand" href="/"><Mark /><span>goar</span></a><p>An operator loop that stays close.</p></div>
        <div className="footer-group"><span className="footer-label">DOCUMENTS</span>{docLinks.map(([href, label]) => <a href={href} key={href}>{label}</a>)}</div>
        <div className="footer-group"><span className="footer-label">DESTINATIONS</span>{serviceLinks.map((service) => <a href={service.href} key={service.href}>{service.label}{service.internal && <span className="footer-separate">WEB</span>}</a>)}</div>
        <div className="footer-aside"><span>© 2026 Goar</span><span>No cookies. No trackers.</span></div>
      </div>
      <div className="goar-shell footer-bottom">
        <span>ANDROID · LOCAL-FIRST · YOURS TO CONFIGURE</span>
        <div>{mediaViews.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}</div>
      </div>
    </footer>
  );
}

export function GoarLanding() {
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme);
  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // Theme still changes for this visit if storage is unavailable.
      }
      return next;
    });
  };

  return (
    <div className="goar-landing" data-theme={theme}>
      <script type="application/ld+json">{JSON.stringify(appSchema)}</script>
      <a className="goar-skip" href="#main-content">Skip to content</a>
      <Header theme={theme} onTheme={toggleTheme} />
      <main id="main-content">
        <Hero />
        <PrivacyStrip />
        <WorkbenchSection />
        <OwnershipSection />
        <MediaSection />
        <ReadinessSection />
        <PolicySection />
      </main>
      <Footer />
    </div>
  );
}

export default GoarLanding;