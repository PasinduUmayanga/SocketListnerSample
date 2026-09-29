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

export function createFakeSocket() {
  const events = createEmitter();
  const ioEvents = createEmitter();

  return {
    connected: false,
    on: events.on,
    off: events.off,
    emit: vi.fn(),
    io: { on: ioEvents.on, off: ioEvents.off },
    __emitFromServer: events.trigger,
    __emitFromManager: ioEvents.trigger,
  };
}

export type FakeSocket = ReturnType<typeof createFakeSocket>;
