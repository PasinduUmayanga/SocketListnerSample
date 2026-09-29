import { useEffect, useState } from 'react';
import { socket } from '../socket/client';

interface LogEntry {
  from: string;
  text: string;
  timestamp: number;
}

export function BroadcastPanel() {
  const [text, setText] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    const handleBroadcast = (payload: LogEntry) => {
      setLog((prev) => [...prev, payload].slice(-10));
    };
    socket.on('broadcast:message', handleBroadcast);
    return () => {
      socket.off('broadcast:message', handleBroadcast);
    };
  }, []);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('client:broadcast', { text });
    setText('');
  };

  return (
    <section className="panel">
      <h2>Broadcast to everyone</h2>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Broadcast message" />
      <button onClick={send}>Send to everyone</button>
      <ul>
        {log.map((entry, i) => (
          <li key={i}>
            <strong>{entry.from.slice(0, 6)}:</strong> {entry.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
