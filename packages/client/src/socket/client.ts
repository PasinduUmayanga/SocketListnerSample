import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@socketlistenersample/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:6600';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Socket.IO only auto-reconnects after network-level drops. A server-initiated
// disconnect (reason "io server disconnect") is intentional and requires an
// explicit reconnect call — see https://socket.io/docs/v4/client-socket-instance/#disconnect
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});
