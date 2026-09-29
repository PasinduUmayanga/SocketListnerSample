import { useSyncExternalStore } from 'react';
import { socket, subscribeConnection, getConnectionSnapshot } from '../socket/client';

export function ReconnectPanel() {
  const { connected, reconnectAttempts, lastDisconnectReason } = useSyncExternalStore(
    subscribeConnection,
    getConnectionSnapshot,
  );

  const forceDisconnect = () => {
    socket.emit('debug:disconnectMe');
  };

  return (
    <section className="panel">
      <h2>Reconnect handling</h2>
      <p>Status: {connected ? 'connected' : 'disconnected'}</p>
      <p>Reconnect attempts: {reconnectAttempts}</p>
      <p>Last disconnect reason: {lastDisconnectReason ?? '–'}</p>
      <button onClick={forceDisconnect}>Force server-side disconnect</button>
    </section>
  );
}
