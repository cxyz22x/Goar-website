export type RuntimePhase = 'loading' | 'setup' | 'ready' | 'error';
export type ConnectionPhase = 'unknown' | 'connecting' | 'local-connecting' | 'local' | 'connected' | 'failed' | 'local-failed';
export type RuntimeSnapshot = {
  phase: RuntimePhase;
  connection: ConnectionPhase;
  detail: string;
  bootError: string;
};

export const initialSnapshot: RuntimeSnapshot = {
  phase: 'loading', connection: 'unknown', detail: '', bootError: '',
};

export function isRuntimeElementVisible(element: Element | null) {
  if (!element) return false;
  const htmlElement = element as HTMLElement;
  if (htmlElement.hidden || element.getAttribute?.('aria-hidden') === 'true') return false;
  if (element.closest?.('[hidden], [aria-hidden="true"]')) return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(htmlElement);
  return element.getClientRects().length > 0 && style?.visibility !== 'hidden' && style?.display !== 'none';
}

/** Observe only status elements; never read API keys, SSH credentials, chats or terminal output. */
export function readRuntimeSnapshot(document: Document): RuntimeSnapshot {
  const errorElement = document.getElementById('err');
  const app = document.getElementById('app');
  const setup = document.getElementById('setup');
  const credentials = document.getElementById('credPhase');
  const appReady = !!app?.classList.contains('show') && isRuntimeElementVisible(app);
  const setupVisible = isRuntimeElementVisible(setup);
  const bootError = (isRuntimeElementVisible(errorElement) || !appReady)
    ? errorElement?.textContent?.trim() || ''
    : '';
  const providerSetup = setupVisible && isRuntimeElementVisible(credentials);
  const phase: RuntimePhase = bootError
    ? 'error'
    : appReady && !setupVisible
      ? 'ready'
      : providerSetup ? 'setup' : 'loading';
  const terminal = document.getElementById('term-tab');
  const terminalStatus = document.getElementById('term-status')?.textContent?.trim() || '';
  const sharedStatus = document.getElementById('kali-status-chip')?.textContent?.trim() || '';
  const terminalVisible = isRuntimeElementVisible(terminal);
  const sharedStatusVisible = isRuntimeElementVisible(document.getElementById('kali-status-chip'));
  const activeStatus = terminalVisible
    ? terminalStatus
    : sharedStatusVisible ? sharedStatus : '';
  const detail = activeStatus.slice(0, 240);
  const isLocalStatus = /\blocal\b/i.test(detail);
  let connection: ConnectionPhase = 'unknown';
  if (/\b(?:failed|failure|closed|disconnected|disconnect|eof|error|unavailable)\b|not connected|unable to connect|could not connect/i.test(detail)) {
    connection = isLocalStatus ? 'local-failed' : 'failed';
  } else if (/\b(?:connecting|reconnect|starting|handshake)\b/i.test(detail)) {
    connection = isLocalStatus ? 'local-connecting' : 'connecting';
  } else if (isLocalStatus && /\bconnected\b/i.test(detail)) {
    connection = 'local';
  } else if (/\bconnected\b/i.test(detail) && (
    sharedStatusVisible || /\b(?:ssh|remote)\b/i.test(detail)
  )) {
    connection = 'connected';
  }
  return { phase, connection, detail, bootError: bootError.slice(0, 240) };
}

export function clickRuntimeControl(document: Document | undefined, id: string) {
  const control = document?.getElementById(id);
  const HtmlElement = document?.defaultView?.HTMLElement;
  if (!HtmlElement || !(control instanceof HtmlElement) || !isRuntimeElementVisible(control)) return false;
  control.click();
  return true;
}