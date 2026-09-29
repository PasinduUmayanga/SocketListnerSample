import { useState } from 'react';
import { socket } from '../socket/client';

export function AckPanel() {
  const [latency, setLatency] = useState<number | null>(null);
  const [echo, setEcho] = useState<string | null>(null);

  const ping = () => {
    const nonce = Math.random().toString(36).slice(2);
    const sentAt = Date.now();
    socket.emit('ack:ping', { nonce, sentAt }, (res) => {
      setLatency(Date.now() - sentAt);
      setEcho(res.echo);
    });
  };

  return (
    <section className="panel">
      <h2>Acknowledgement callback</h2>
      <button onClick={ping}>Ping</button>
      <p>Round-trip: {latency !== null ? `${latency}ms` : '–'}</p>
      <p>Echo: {echo ?? '–'}</p>
    </section>
  );
}
