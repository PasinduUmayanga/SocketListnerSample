import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@socketlistenersample/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:6600';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// The socket connects as soon as this module loads, which can happen before any
// React component has mounted and attached its own listeners — so `connect` and
// the connect-time `welcome` push can fire before a component is around to hear
// them. Track the live state here, at module scope, so components can read the
// current snapshot at mount time (via getConnectionSnapshot) instead of only
// reacting to events that occur after they've subscribed.
export interface ConnectionSnapshot {
  connected: boolean;
  lastWelcome: { message: string; timestamp: number } | null;
  reconnectAttempts: number;
  lastDisconnectReason: string | null;
}

let snapshot: ConnectionSnapshot = {
  connected: socket.connected,
  lastWelcome: null,
  reconnectAttempts: 0,
  lastDisconnectReason: null,
};

const subscribers = new Set<() => void>();

function updateSnapshot(patch: Partial<ConnectionSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  subscribers.forEach((notify) => notify());
}

export function subscribeConnection(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function getConnectionSnapshot(): ConnectionSnapshot {
  return snapshot;
}

socket.on('connect', () => {
  updateSnapshot({ connected: true, reconnectAttempts: 0 });
});

socket.on('welcome', (payload) => {
  updateSnapshot({ lastWelcome: payload });
});

socket.io.on('reconnect_attempt', () => {
  updateSnapshot({ reconnectAttempts: snapshot.reconnectAttempts + 1 });
});

// Socket.IO only auto-reconnects after network-level drops. A server-initiated
// disconnect (reason "io server disconnect") is intentional and requires an
// explicit reconnect call — see https://socket.io/docs/v4/client-socket-instance/#disconnect
socket.on('disconnect', (reason) => {
  updateSnapshot({ connected: false, lastDisconnectReason: reason });
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});
