import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialSnapshot, readRuntimeSnapshot } from './runtime-dom.ts';

function statusDocument({ ready = true, appVisible = ready, terminal = false, term = '', shared = '', error = '', setup = false }: {
  ready?: boolean; appVisible?: boolean; terminal?: boolean; term?: string; shared?: string; error?: string; setup?: boolean;
} = {}) {
  const elements: Record<string, unknown> = {
    err: element(!!error, { textContent: error }),
    app: element(appVisible, { classList: { contains: (name: string) => name === 'show' && ready } }),
    setup: element(!ready, {}),
    credPhase: element(setup, {}),
    'term-tab': element(terminal, { ariaHidden: !terminal }),
    'term-status': element(terminal, { textContent: term }),
    'kali-status-chip': element(!!shared, { textContent: shared }),
  };
  function element(isVisible: boolean, values: Record<string, unknown>) {
    return {
      ...values,
      hidden: !isVisible,
      getAttribute: (name: string) => name === 'aria-hidden' && values.ariaHidden ? 'true' : null,
      closest: () => null,
      getClientRects: () => isVisible ? [1] : [],
      ownerDocument: { defaultView: { getComputedStyle: () => ({ visibility: 'visible', display: 'block' }) } },
    };
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
  assert.equal(readRuntimeSnapshot(statusDocument({ terminal: true, term: 'Local shell starting' })).connection, 'local-connecting');
  assert.equal(readRuntimeSnapshot(statusDocument({ terminal: true, term: 'Local shell failed' })).connection, 'local-failed');
});

test('a hidden terminal cannot leave stale local or SSH status behind', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ term: 'Connected · ssh' })).connection, 'unknown');
  assert.equal(readRuntimeSnapshot(statusDocument({ term: 'Connected · local' })).connection, 'unknown');
});

test('disconnected, closed, EOF and failed statuses never show success', () => {
  for (const shared of ['Disconnected', 'SSH handshake failed', 'wisp stream closed', 'EOF', 'Connection error', 'SSH not connected']) {
    assert.equal(readRuntimeSnapshot(statusDocument({ shared })).connection, 'failed');
  }
});

test('SSH success requires the supplied runtime connected status', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ shared: 'SSH connected' })).connection, 'connected');
});

test('a generic terminal connected label is not assumed to mean SSH', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ terminal: true, term: 'Connected' })).connection, 'unknown');
  assert.equal(readRuntimeSnapshot(statusDocument({ terminal: true, term: 'SSH connected' })).connection, 'connected');
});

test('boot errors and provider setup are surfaced', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ error: 'Boot failed' })).phase, 'error');
  assert.equal(readRuntimeSnapshot(statusDocument({ ready: false, setup: true })).phase, 'setup');
});

test('agent readiness requires the actual app view to be visible', () => {
  assert.equal(readRuntimeSnapshot(statusDocument({ ready: true, appVisible: false })).phase, 'loading');
});