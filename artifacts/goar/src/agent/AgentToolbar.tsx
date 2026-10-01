import { Link } from 'wouter';

export function AgentToolbar({ ready, onSettings, onDefaultSSH, onTerminal, onRestart }: {
  ready: boolean; onSettings: () => void; onDefaultSSH: () => void; onTerminal: () => void; onRestart: () => void;
}) {
  return (
    <header className="agent-toolbar">
      <Link href="/" className="agent-home">Goar</Link>
      <span className="agent-title">Online agent <small>Free browser service · not the Goar app</small></span>
      <nav aria-label="Agent service">
        <Link href="/connections">Connections</Link>
        <button disabled={!ready} onClick={onSettings}>Settings / SSH</button>
        <button disabled={!ready} onClick={onDefaultSSH}>Default SSH</button>
        <button disabled={!ready} onClick={onTerminal}>Terminal</button>
        <button onClick={onRestart}>Reload agent</button>
      </nav>
    </header>
  );
}