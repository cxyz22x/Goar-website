export const BASE = import.meta.env.BASE_URL;
export const buildSteps = ['Open the project', 'Run the configured build tools', 'Check the build output', 'Save the APK'];
export const androidFeatures = [
  ['Scheduled work', 'Tasks, Watchtower and overnight runs let you configure recurring work. Local execution depends on Android background settings and device availability.'],
  ['Memory and skills', 'Keep notes across chats and give the agent playbooks to follow.'],
  ['Browser and desktop', 'Use the in-app browser or connect to a Linux desktop through VNC over SSH.'],
  ['Images and video', 'Use the providers you configure for creative work, alongside your project files and conversations.'],
];
export const dataControls = [
  ['Choose the AI provider', 'Configure the keys and endpoints used for chat.'],
  ['Choose where commands run', 'Use the on-device sandbox or SSH hosts you connect.'],
  ['Control exports and backups', 'Use Data settings to export, import and back up your setup. This is separate from Android cloud backup, which the supplied policy says is disabled.'],
];
export const services = [
  { href: '/connections', title: 'Connections', text: 'How the Goar app, this site and the connected services relate.', internal: true, id: 'connections' },
  { href: '/agent', title: 'Agent', text: 'A separate online service you can try in the browser. It is not Goar itself.', internal: true, id: 'agent' },
  { href: `${BASE}media/index.html`, title: 'Media', text: 'Uploaded media hub for this site.', internal: false, id: 'media' },
];
export const footerLinks = [
  ['/privacy.html', 'Privacy'], ['/terms.html', 'Terms'], ['/license.html', 'Licence'], ['/data-safety.html', 'Data safety'], ['/contact.html', 'Contact'],
];
