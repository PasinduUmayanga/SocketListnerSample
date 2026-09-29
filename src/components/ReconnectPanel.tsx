import { useEffect, useState } from 'react';
import { socket } from '../socket/client';

type Status = 'connected' | 'disconnected' | 'reconnecting';

export function ReconnectPanel() {
  const [status, setStatus] = useState<Status>(socket.connected ? 'connected' : 'disconnected');
  const [attempts, setAttempts] = useState(0);
  const [lastDisconnectReason, setLastDisconnectReason] = useState<string | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      setStatus('connected');
      setAttempts(0);
    };
    const handleDisconnect = (reason: string) => {
      setStatus('disconnected');
      setLastDisconnectReason(reason);
    };
    const handleReconnectAttempt = () => {
      setStatus('reconnecting');
      setAttempts((prev) => prev + 1);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, []);

  const forceDisconnect = () => {
    socket.emit('debug:disconnectMe');
  };

  return (
    <section className="panel">
      <h2>Reconnect handling</h2>
      <p>Status: {status}</p>
      <p>Reconnect attempts: {attempts}</p>
      <p>Last disconnect reason: {lastDisconnectReason ?? '–'}</p>
      <button onClick={forceDisconnect}>Force server-side disconnect</button>
    </section>
  );
}
