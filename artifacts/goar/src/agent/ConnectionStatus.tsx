import { type RuntimeSnapshot } from './runtime-dom';

export function ConnectionStatus({ snapshot, timedOut, notice, onSettings, onReconnect }: {
  snapshot: RuntimeSnapshot;
  timedOut: boolean;
  notice: string;
  onSettings: () => void;
  onReconnect: () => void;
}) {
  const labels = {
    unknown: 'SSH status not established',
    connecting: 'SSH connecting',
    connected: 'SSH connected',
    local: 'Local shell connected · not SSH',
    failed: 'SSH connection unavailable',
  };
  return (
    <aside className={`agent-status ${snapshot.connection === 'failed' || snapshot.phase === 'error' ? 'agent-status-error' : ''}`} aria-live="polite">
      <span><strong>{snapshot.phase === 'ready' ? 'Agent ready' : snapshot.phase === 'setup' ? 'Choose a provider below' : snapshot.phase === 'error' ? 'Agent failed to start' : 'Starting the supplied agent'}</strong> · {labels[snapshot.connection]}</span>
      {snapshot.detail && <span className="agent-status-detail">{snapshot.detail}</span>}
      {snapshot.phase === 'error' && <p>{snapshot.bootError}</p>}
      {timedOut && <p>Startup is taking longer than expected. Reload the agent or open its standalone page. External providers or the relay may be unavailable.</p>}
      {snapshot.connection === 'failed' && (
        <p>SSH did not connect in this session. For the supplied connection, use Default SSH above, or open Settings and choose its Default preset before saving. For your own connection, check the host, port and relay, then reconnect in Terminal. <button onClick={onSettings}>Open connection settings</button> <button onClick={onReconnect}>Reconnect in Terminal</button></p>
      )}
      {notice && <p role="status">{notice}</p>}
    </aside>
  );
}