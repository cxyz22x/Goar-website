export type ConnectedService = {
  id: string;
  name: string;
  description: string;
  path: string;
  externalDocument?: boolean;
  requirements: string;
};

export const services: ConnectedService[] = [
  {
    id: 'agent',
    name: 'Online agent',
    description: 'Try the browser agent, chat with an available provider and configure an SSH connection.',
    path: '/agent',
    requirements: 'Free access to the browser service. AI providers and SSH hosts have their own availability and limits. This service is not the Goar Android app.',
  },
  {
    id: 'watch',
    name: 'Movies, series and live TV',
    description: 'Open the supplied catalogue, search titles and use its existing provider connections.',
    path: '/media/index.html?view=watch',
    externalDocument: true,
    requirements: 'Metadata, sources and playback depend on third-party services and their terms. No streaming availability or content rights are guaranteed.',
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Browse the supplied music service or play your own local audio files with its queue and player.',
    path: '/media/index.html?view=music',
    externalDocument: true,
    requirements: 'Local files stay in your browser session. Online music sources require network access and may be unavailable.',
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Browse and open games from the supplied catalogue.',
    path: '/media/index.html?view=games',
    externalDocument: true,
    requirements: 'Games run on third-party sites in their own frames and remain subject to those sites’ terms.',
  },
];

export function serviceUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}