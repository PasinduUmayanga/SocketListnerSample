import { vi } from 'vitest';

type Handler = (...args: unknown[]) => void;

function createEmitter() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    on(event: string, handler: Handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    },
    off(event: string, handler: Handler) {
      listeners.get(event)?.delete(handler);
    },
    trigger(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((handler) => handler(...args));
    },
  };
}

interface FakeConnectionSnapshot {
  connected: boolean;
  lastWelcome: { message: string; timestamp: number } | null;
  reconnectAttempts: number;
  lastDisconnectReason: string | null;
}

export function createFakeSocket() {
  const events = createEmitter();
  const ioEvents = createEmitter();

  let snapshot: FakeConnectionSnapshot = {
    connected: false,
    lastWelcome: null,
    reconnectAttempts: 0,
    lastDisconnectReason: null,
  };
  const subscribers = new Set<() => void>();
  const updateSnapshot = (patch: Partial<FakeConnectionSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    subscribers.forEach((notify) => notify());
  };

  events.on('connect', () => updateSnapshot({ connected: true, reconnectAttempts: 0 }));
  events.on('disconnect', (reason) => updateSnapshot({ connected: false, lastDisconnectReason: reason as string }));
  events.on('welcome', (payload) => updateSnapshot({ lastWelcome: payload as FakeConnectionSnapshot['lastWelcome'] }));
  ioEvents.on('reconnect_attempt', () => updateSnapshot({ reconnectAttempts: snapshot.reconnectAttempts + 1 }));

  return {
    connected: false,
    on: events.on,
    off: events.off,
    emit: vi.fn(),
    io: { on: ioEvents.on, off: ioEvents.off },
    __emitFromServer: events.trigger,
    __emitFromManager: ioEvents.trigger,
    subscribeConnection: (callback: () => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    getConnectionSnapshot: () => snapshot,
  };
}

export type FakeSocket = ReturnType<typeof createFakeSocket>;
