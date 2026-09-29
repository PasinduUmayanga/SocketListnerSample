import { useSyncExternalStore } from 'react';
import { subscribeConnection, getConnectionSnapshot } from '../socket/client';

export function BaselinePanel() {
  const { connected, lastWelcome } = useSyncExternalStore(subscribeConnection, getConnectionSnapshot);

  return (
    <section className="panel">
      <h2>Baseline push</h2>
      <p>Status: {connected ? 'connected' : 'disconnected'}</p>
      <h1>{lastWelcome?.message ?? '–'}</h1>
    </section>
  );
}
