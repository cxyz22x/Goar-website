import { useState } from 'react';
import { AgentToolbar } from './AgentToolbar';
import { ConnectionStatus } from './ConnectionStatus';
import { clickRuntimeControl } from './runtime-dom';
import { useRuntimeStatus } from './useRuntimeStatus';
import './agent.css';

const runtimeUrl = `${import.meta.env.BASE_URL}workspace/index.html`;

export default function AgentWorkspace() {
  const { frameRef, snapshot, timedOut, generation, onLoad, restart } = useRuntimeStatus();
  const [notice, setNotice] = useState('');
  function activate(id: string) {
    try {
      if (clickRuntimeControl(frameRef.current?.contentDocument || undefined, id)) setNotice('');
      else setNotice('This control is not available yet. Finish provider setup inside the agent first.');
    } catch {
      setNotice('The embedded agent could not be controlled here. Use its standalone page below.');
    }
  }
  function reconnect() {
    activate('btn-top-term');
    activate('btn-term-reconnect');
  }
  async function applyDefaultSSH() {
    const document = frameRef.current?.contentDocument;
    if (!document || snapshot.phase !== 'ready') return;
    for (const id of ['btn-top-settings', 'btnSshDefault', 'btnSaveSettings', 'btnCloseSettings', 'btn-top-term', 'btn-term-ssh']) {
      if (!clickRuntimeControl(document, id)) {
        setNotice('Finish the default SSH setup using the agent’s Settings panel below.');
        return;
      }
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
    }
    setNotice('The supplied default SSH preset was selected. Connection status comes from the agent below.');
  }
  return (
    <div className="agent-service">
      <AgentToolbar ready={snapshot.phase === 'ready'} onSettings={() => activate('btn-top-settings')} onDefaultSSH={applyDefaultSSH} onTerminal={() => activate('btn-top-term')} onRestart={restart} />
      <ConnectionStatus snapshot={snapshot} timedOut={timedOut} notice={notice} onSettings={() => activate('btn-top-settings')} onReconnect={reconnect} />
      <iframe key={generation} ref={frameRef} src={runtimeUrl} title="Free online agent service — separate from Goar" onLoad={onLoad} className="agent-frame" allow="clipboard-read; clipboard-write; fullscreen" />
      <footer className="agent-footer">
        <span>Provider and host limits apply. Local Terminal is a limited browser shell, not free remote compute.</span>
        <a href={runtimeUrl}>Open standalone agent</a>
      </footer>
    </div>
  );
}