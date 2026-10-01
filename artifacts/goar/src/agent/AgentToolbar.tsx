import { Link } from 'wouter';

const BASE = import.meta.env.BASE_URL;

export function AgentToolbar({ ready, onSettings, onDefaultSSH, onTerminal, onRestart }: {
  ready: boolean; onSettings: () => void; onDefaultSSH: () => void; onTerminal: () => void; onRestart: () => void;
}) {
  return (
    <header className="agent-toolbar">
      <Link href="/" className="agent-home">Goar</Link>
      <span className="agent-title">Online agent <small>Free browser service · not the Goar app</small></span>
      <nav aria-label="Agent service">
        <a href={`${BASE}pages/watch/index.html?tab=movie`}>Watch</a>
        <a href={`${BASE}pages/music/index.html`}>Music</a>
        <a href={`${BASE}pages/games/index.html`}>Games</a>
        <a href={`${BASE}pages/live/index.html`}>Live</a>
        <a href={`${BASE}pages/anime/index.html`}>Anime</a>
        <button disabled={!ready} onClick={onSettings}>Settings / SSH</button>
        <button disabled={!ready} onClick={onDefaultSSH}>Default SSH</button>
        <button disabled={!ready} onClick={onTerminal}>Terminal</button>
        <button onClick={onRestart}>Reload agent</button>
      </nav>
    </header>
  );
}