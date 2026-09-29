import { useEffect, useState } from 'react';
import { socket } from '../socket/client';
import { ROOMS, type RoomName } from '@socketlistenersample/shared';

interface LogEntry {
  room: string;
  from: string;
  text: string;
  timestamp: number;
}

export function RoomsPanel() {
  const [room, setRoom] = useState<RoomName>(ROOMS[0]);
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    const handleRoomMessage = (payload: LogEntry) => {
      setLog((prev) => [...prev, payload].slice(-10));
    };
    socket.on('room:message', handleRoomMessage);
    return () => {
      socket.off('room:message', handleRoomMessage);
    };
  }, []);

  const join = () => {
    socket.emit('room:join', { room }, (res) => {
      setJoinedRoom(res.room);
    });
  };

  const send = () => {
    if (!joinedRoom || !text.trim()) return;
    socket.emit('room:message', { room: joinedRoom, text });
    setText('');
  };

  return (
    <section className="panel">
      <h2>Rooms</h2>
      <select value={room} onChange={(e) => setRoom(e.target.value as RoomName)}>
        {ROOMS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button onClick={join}>Join</button>
      <p>Joined: {joinedRoom ?? 'none'}</p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Room message"
        disabled={!joinedRoom}
      />
      <button onClick={send} disabled={!joinedRoom}>
        Send to room
      </button>
      <ul>
        {log.map((entry, i) => (
          <li key={i}>
            <strong>[{entry.room}] {entry.from.slice(0, 6)}:</strong> {entry.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
