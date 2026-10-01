import { Link } from 'wouter';

export function AgentToolbar({ ready, onSettings, onDefaultSSH, onTerminal, onRestart }: {
  ready: boolean; onSettings: () => void; onDefaultSSH: () => void; onTerminal: () => void; onRestart: () => void;
}) {
  return (
    <header className="agent-toolbar">
      <Link href="/" className="agent-home">Goar</Link>
      <span className="agent-title">Online agent <small>Free browser service · not the Goar app</small></span>
      <nav aria-label="Agent service">
        <a href={`${import.meta.env.BASE_URL}media/index.html?view=watch`}>Watch</a>
        <a href={`${import.meta.env.BASE_URL}media/index.html?view=music`}>Music</a>
        <a href={`${import.meta.env.BASE_URL}media/index.html?view=games`}>Games</a>
        <button disabled={!ready} onClick={onSettings}>Settings / SSH</button>
        <button disabled={!ready} onClick={onDefaultSSH}>Default SSH</button>
        <button disabled={!ready} onClick={onTerminal}>Terminal</button>
        <button onClick={onRestart}>Reload agent</button>
      </nav>
    </header>
  );
}