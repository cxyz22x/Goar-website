import { useState } from 'react';
import { AgentToolbar } from './AgentToolbar';
import { ConnectionStatus } from './ConnectionStatus';
import { clickRuntimeControl, isRuntimeElementVisible } from './runtime-dom';
import { useRuntimeStatus } from './useRuntimeStatus';
import './agent.css';

const runtimeUrl = `${import.meta.env.BASE_URL}workspace/index.html?build=c27a38b4`;

function waitForRuntimeCondition(condition: () => boolean, timeoutMs = 3000) {
  const deadline = window.performance.now() + timeoutMs;
  return new Promise<boolean>(resolve => {
    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (window.performance.now() >= deadline) {
        resolve(false);
      } else {
        window.setTimeout(check, 50);
      }
    };
    check();
  });
}

function runtimeControlVisible(document: Document, id: string) {
  return isRuntimeElementVisible(document.getElementById(id));
}

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
    if (!clickRuntimeControl(document, 'btn-top-settings')) {
      setNotice('Open Settings inside the agent, then finish the default SSH setup there.');
      return;
    }
    if (!await waitForRuntimeCondition(() => runtimeControlVisible(document, 'btnSshDefault'))) {
      setNotice('Settings did not open. Finish the default SSH setup using the agent below.');
      return;
    }
    if (!clickRuntimeControl(document, 'btnSshDefault')) {
      setNotice('The default SSH preset is not available. Choose it in the agent Settings panel below.');
      return;
    }
    if (!await waitForRuntimeCondition(() => runtimeControlVisible(document, 'btnSaveSettings'))) {
      setNotice('The preset was selected, but Save is not available. Finish setup in the agent Settings panel below.');
      return;
    }
    if (!clickRuntimeControl(document, 'btnSaveSettings')) {
      setNotice('The preset was selected, but Save could not be activated. Finish setup in the agent below.');
      return;
    }
    const settingsClosed = await waitForRuntimeCondition(
      () => !runtimeControlVisible(document, 'settings'),
      1500,
    );
    if (!settingsClosed) {
      const closeButton = runtimeControlVisible(document, 'btnCloseSettings')
        ? 'btnCloseSettings'
        : runtimeControlVisible(document, 'btnCloseSettingsTop') ? 'btnCloseSettingsTop' : '';
      if (closeButton) clickRuntimeControl(document, closeButton);
      else {
        setNotice('The SSH preset was saved, but Settings remains open. Close it in the agent before opening Terminal.');
        return;
      }
    }
    if (!runtimeControlVisible(document, 'term-tab') && !clickRuntimeControl(document, 'btn-top-term')) {
      setNotice('The default SSH preset was saved. Open Terminal inside the agent to continue.');
      return;
    }
    if (!await waitForRuntimeCondition(() => runtimeControlVisible(document, 'term-tab'))) {
      setNotice('The default SSH preset was saved, but Terminal did not open. Open it inside the agent.');
      return;
    }
    if (!await waitForRuntimeCondition(() => runtimeControlVisible(document, 'btn-term-ssh'))) {
      setNotice('The preset was saved and Terminal opened, but its SSH control is hidden in this layout. Select SSH inside the agent.');
      return;
    }
    if (!clickRuntimeControl(document, 'btn-term-ssh')) {
      setNotice('The preset was saved, but SSH could not be selected. Select it inside the agent Terminal.');
      return;
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