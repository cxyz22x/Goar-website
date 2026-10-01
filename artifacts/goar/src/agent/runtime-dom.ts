export type RuntimePhase = 'loading' | 'setup' | 'ready' | 'error';
export type ConnectionPhase = 'unknown' | 'connecting' | 'local' | 'connected' | 'failed';
export type RuntimeSnapshot = {
  phase: RuntimePhase;
  connection: ConnectionPhase;
  detail: string;
  bootError: string;
};

export const initialSnapshot: RuntimeSnapshot = {
  phase: 'loading', connection: 'unknown', detail: '', bootError: '',
};

function visible(element: HTMLElement | null) {
  if (!element) return false;
  return element.getClientRects().length > 0 && element.ownerDocument.defaultView?.getComputedStyle(element).visibility !== 'hidden';
}

/** Observe only status elements; never read API keys, SSH credentials, chats or terminal output. */
export function readRuntimeSnapshot(document: Document): RuntimeSnapshot {
  const bootError = document.getElementById('err')?.textContent?.trim() || '';
  const app = document.getElementById('app');
  const setup = document.getElementById('setup');
  const credentials = document.getElementById('credPhase');
  const phase: RuntimePhase = bootError
    ? 'error'
    : app?.classList.contains('show') && !visible(setup)
      ? 'ready'
      : visible(credentials) ? 'setup' : 'loading';
  const terminal = document.getElementById('term-tab');
  const terminalStatus = document.getElementById('term-status')?.textContent?.trim() || '';
  const sharedStatus = document.getElementById('kali-status-chip')?.textContent?.trim() || '';
  const detail = (visible(terminal) ? terminalStatus : sharedStatus || terminalStatus).slice(0, 240);
  let connection: ConnectionPhase = 'unknown';
  if (/failed|failure|closed|disconnected|EOF|error/i.test(detail)) connection = 'failed';
  else if (/local/i.test(detail) && /connected/i.test(detail)) connection = 'local';
  else if (/connecting|reconnect|starting/i.test(detail)) connection = 'connecting';
  else if (/connected/i.test(detail)) connection = 'connected';
  return { phase, connection, detail, bootError: bootError.slice(0, 240) };
}

export function clickRuntimeControl(document: Document | undefined, id: string) {
  const control = document?.getElementById(id);
  if (!(control instanceof (document?.defaultView?.HTMLElement || HTMLElement)) || !visible(control as HTMLElement)) return false;
  (control as HTMLElement).click();
  return true;
}