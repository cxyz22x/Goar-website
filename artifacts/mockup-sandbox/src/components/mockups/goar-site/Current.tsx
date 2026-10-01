import { useState } from 'react';
import './_group.css';

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

const phoneMessages = [
  { who: 'user', text: 'Clone the repo, start the desktop, and show me the running app.' },
  { who: 'agent', tool: 'computer · files · shell', text: 'Imported into ~/projects. VNC is live on the loopback pipe. Chromium is up.' },
  { who: 'agent', text: 'Watch is view-only. Take over when the login screen appears.' },
] as const;

const facts = [
  ['No account', 'Nothing is sent to a Goar server. There isn’t one.'],
  ['No telemetry', 'No analytics, ads, crash phones-home, or update checkers.'],
  ['Your keys', 'Providers, SSH, and MCP URLs are yours. Stored on-device.'],
  ['Your machines', 'Sandbox on the phone, or SSH to a VPS. Separate disks.'],
] as const;

const surfaces = [
  ['Chat', 'The operator loop. Tools, memory, skills, and Computer live in the conversation. Composer is a pill: attach, type, send.'],
  ['Files & Notes', 'Browse SSH or the on-device sandbox. Search, upload, zip and rar, a notes editor, a code editor. Git clone lives here.'],
  ['Computer', 'Live VNC of a Linux desktop. SSH is only a pipe to 127.0.0.1:5901 unless you open the port. You set port, size, and password in Settings → Computer.'],
  ['Terminal', 'Shell on the sandbox or a host you pin. Jobs on SSH keep running if the phone sleeps. The agent does not move onto the VPS.'],
  ['Browser', 'One in-app browser the operator and the agent share. You choose search and fetch endpoints.'],
  ['Creative', 'Stills, edits, video through providers you enable. Pollinations stills need no key. Video and edits do.'],
] as const;

const policies = [
  ['Privacy policy', 'Required store URL. What stays on device, what leaves only because you sent it, how to delete data.', '/privacy.html', 'Read privacy'],
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

function Header({ onTheme }: { onTheme: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={open ? 'nav open' : 'nav'}>
      <div className="wrap nav-inner">
        <a className="brand" href="/" data-testid="link-home"><span className="brand-mark" aria-hidden="true" />Goar</a>
        <button className="nav-toggle" type="button" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((value) => !value)} data-testid="button-menu">Menu</button>
        <nav className="nav-links" aria-label="Primary">
          <a href="/" aria-current="page">Product</a>
          {docLinks.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          {serviceLinks.map((service) => <a key={service.href} href={service.href} data-testid={`link-nav-${service.label.toLowerCase()}`}>{service.label}</a>)}
          <button className="theme-btn" type="button" aria-label="Toggle light and dark" onClick={onTheme} data-testid="button-theme">◐</button>
        </nav>
      </div>
    </header>
  );
}

function PhoneMock() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-screen">
        <div className="phone-top">
          <span className="brand-mark" style={{ width: 18, height: 18 }} />
          Goar
          <span>local</span>
        </div>
        <div className="phone-body">
          {phoneMessages.map((message, index) => (
            <div key={index} className={`msg ${message.who}`}>
              {'tool' in message && <div className="tool">{message.tool}</div>}
              {message.text}
            </div>
          ))}
        </div>
        <div className="composer">Ask Goar<span></span><b>↑</b></div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="wrap hero">
      <div>
        <p className="kicker">Android · arm64 · F-Droid posture</p>
        <h1>One system on this phone.</h1>
        <p className="lede">Chat, files, terminal, browser, and a live desktop. No Goar account. No analytics. You bring the model keys and the machines. The agent stays on the device.</p>
        <div className="cta-row">
          <a className="pill solid" href="/contact.html" data-testid="link-contact">Contact &amp; Play listing</a>
          <a className="pill ghost" href="/privacy.html" data-testid="link-privacy-hero">Privacy policy</a>
        </div>
      </div>
      <PhoneMock />
    </section>
  );
}

function Facts() {
  return (
    <section className="band">
      <div className="wrap facts">
        {facts.map(([title, detail]) => <div className="fact" key={title}><strong>{title}</strong><span>{detail}</span></div>)}
      </div>
    </section>
  );
}

function Surfaces() {
  return (
    <section className="wrap">
      <h2 className="section-title">The same surfaces as the APK.</h2>
      <p className="section-copy">One session. Destinations do not stack. Ink and bone, never purple, never a pure white fill.</p>
      <div className="grid">
        {surfaces.map(([title, detail]) => <article className="card" key={title}><h3>{title}</h3><p>{detail}</p></article>)}
      </div>
    </section>
  );
}

function PlayReady() {
  return (
    <section className="wrap">
      <h2 className="section-title">Play-ready, F-Droid honest.</h2>
      <p className="section-copy">Package <code>app.goar</code>. Android 8+, arm64-v8a. Cloud backup is off. Legal documents ship in the APK and on this site.</p>
      <div className="grid">
        {policies.map(([title, detail, href, label]) => (
          <article className="card" key={title}>
            <h3>{title}</h3>
            <p>{detail}</p>
            <p><a className="pill ghost" href={href} style={{ marginTop: '1rem' }} data-testid={`link-policy-${href.slice(1, -5)}`}>{label}</a></p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <span>© 2026 Goar</span>
        {docLinks.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        {serviceLinks.map((service) => <a key={service.href} href={service.href}>{service.label}</a>)}
        {mediaViews.map((media) => <a key={media.href} href={media.href}>{media.label}</a>)}
        <span className="sp">No cookies. No trackers.</span>
      </div>
    </footer>
  );
}

function getInitialTheme(): 'light' | 'dark' {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage can be unavailable in a restricted preview context.
  }
  return 'dark';
}

export function Current() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const toggle = () => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // The visual toggle still works if storage is unavailable.
      }
      return next;
    });
  };

  return (
    <div className="gp min-h-screen" data-theme={theme}>
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