export const BASE = import.meta.env.BASE_URL;

export const THEME_KEY = 'goar-theme';

export const docLinks = [
  ['/privacy.html', 'Privacy'],
  ['/terms.html', 'Terms'],
  ['/license.html', 'License'],
  ['/data-safety.html', 'Data safety'],
  ['/contact.html', 'Contact'],
] as const;

/* Connected website services, added as entry points beside the source links. */
export const serviceLinks = [
  { href: `${BASE}workspace/index.html`, label: 'Agent', internal: false },
  { href: `${BASE}pages/watch/index.html?tab=movie`, label: 'Watch', internal: false },
  { href: `${BASE}pages/music/index.html`, label: 'Music', internal: false },
  { href: `${BASE}pages/games/index.html`, label: 'Games', internal: false },
  { href: `${BASE}pages/live/index.html`, label: 'Live', internal: false },
  { href: `${BASE}pages/anime/index.html`, label: 'Anime', internal: false },
] as const;

export const mediaViews = [
  { href: `${BASE}pages/watch/index.html?tab=movie`, label: 'Watch' },
  { href: `${BASE}pages/music/index.html`, label: 'Music' },
  { href: `${BASE}pages/games/index.html`, label: 'Games' },
  { href: `${BASE}pages/live/index.html`, label: 'Live' },
  { href: `${BASE}pages/anime/index.html`, label: 'Anime' },
] as const;

export const phoneMessages = [
  { who: 'user', text: 'Clone the repo, start the desktop, and show me the running app.' },
  { who: 'agent', tool: 'computer · files · shell', text: 'Imported into ~/projects. VNC is live on the loopback pipe. Chromium is up.' },
  { who: 'agent', text: 'Watch is view-only. Take over when the login screen appears.' },
] as const;

export const facts = [
  ['No account', 'Nothing is sent to a Goar server. There isn’t one.'],
  ['No telemetry', 'No analytics, ads, crash phones-home, or update checkers.'],
  ['Your keys', 'Providers, SSH, and MCP URLs are yours. Stored on-device.'],
  ['Your machines', 'Sandbox on the phone, or SSH to a VPS. Separate disks.'],
] as const;

export const surfaces = [
  ['Chat', 'The operator loop. Tools, memory, skills, and Computer live in the conversation. Composer is a pill: attach, type, send.'],
  ['Files & Notes', 'Browse SSH or the on-device sandbox. Search, upload, zip and rar, a notes editor, a code editor. Git clone lives here.'],
  ['Computer', 'Live VNC of a Linux desktop. SSH is only a pipe to 127.0.0.1:5901 unless you open the port. You set port, size, and password in Settings → Computer.'],
  ['Terminal', 'Shell on the sandbox or a host you pin. Jobs on SSH keep running if the phone sleeps. The agent does not move onto the VPS.'],
  ['Browser', 'One in-app browser the operator and the agent share. You choose search and fetch endpoints.'],
  ['Creative', 'Stills, edits, video through providers you enable. Pollinations stills need no key. Video and edits do.'],
] as const;

export const policies = [
  ['Privacy policy', 'Required store URL. What stays on device, what leaves only because you sent it, how to delete data.', '/privacy.html', 'Read privacy'],
  ['Terms & licence', 'You are responsible for keys and hosts you attach. MIT licence. No warranty.', '/terms.html', 'Read terms'],
  ['Data safety', 'Mapped to the Play Data safety form: we collect nothing. Third parties are only the ones you configure.', '/data-safety.html', 'Data safety'],
] as const;
