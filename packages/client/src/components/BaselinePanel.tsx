import { useEffect, useState } from 'react';
import { socket } from '../socket/client';

export function BaselinePanel() {
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const handleWelcome = (payload: { message: string; timestamp: number }) => {
      setMessage(payload.message);
    };
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('welcome', handleWelcome);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('welcome', handleWelcome);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return (
    <section className="panel">
      <h2>Baseline push</h2>
      <p>Status: {connected ? 'connected' : 'disconnected'}</p>
      <h1>{message || '–'}</h1>
    </section>
  );
}
