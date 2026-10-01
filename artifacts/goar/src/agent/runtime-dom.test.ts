import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialSnapshot, readRuntimeSnapshot } from './runtime-dom.ts';

function statusDocument({ ready = true, terminal = false, term = '', shared = '', error = '', setup = false }: {
  ready?: boolean; terminal?: boolean; term?: string; shared?: string; error?: string; setup?: boolean;
} = {}) {
  const elements: Record<string, unknown> = {
    err: { textContent: error },
    app: { classList: { contains: (name: string) => name === 'show' && ready } },
    setup: element(!ready),
    credPhase: element(setup),
    'term-tab': element(terminal),
    'term-status': { textContent: term },
    'kali-status-chip': { textContent: shared },
  };
  function element(isVisible: boolean) {
    return { getClientRects: () => isVisible ? [1] : [], ownerDocument: { defaultView: { getComputedStyle: () => ({ visibility: 'visible' }) } } };
  }
  return { getElementById: (id: string) => elements[id] || null } as unknown as Document;
}

test('never declares remote SSH connected merely because agent has booted', () => {
  assert.equal(readRuntimeSnapshot(statusDocument()).phase, 'ready');
  assert.equal(readRuntimeSnapshot(statusDocument()).connection, 'unknown');
  assert.equal(initialSnapshot.connection, 'unknown');
});

test('connecting is not mistaken for connected', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ shared: 'Kali connecting…' })).connection, 'connecting');
});

test('local terminal is explicitly distinguished from remote SSH', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ terminal: true, term: 'Connected · local' })).connection, 'local');
});

test('disconnected, closed, EOF and failed statuses never show success', () => {
  for (const shared of ['Disconnected', 'SSH handshake failed', 'wisp stream closed', 'EOF', 'Connection error']) {
    assert.equal(readRuntimeSnapshot(statusDocument({ shared })).connection, 'failed');
  }
});

test('SSH success requires the supplied runtime connected status', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ shared: 'SSH connected' })).connection, 'connected');
});

test('boot errors and provider setup are surfaced', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ error: 'Boot failed' })).phase, 'error');
  assert.equal(readRuntimeSnapshot(statusDocument({ ready: false, setup: true })).phase, 'setup');
});