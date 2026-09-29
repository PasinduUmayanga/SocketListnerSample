export interface ServerToClientEvents {
  welcome: (payload: { message: string; timestamp: number }) => void;
  'broadcast:message': (payload: { from: string; text: string; timestamp: number }) => void;
  'room:message': (payload: { room: string; from: string; text: string; timestamp: number }) => void;
}

export interface ClientToServerEvents {
  'client:broadcast': (payload: { text: string }) => void;
  'room:join': (payload: { room: string }, ack: (res: { ok: true; room: string }) => void) => void;
  'room:message': (payload: { room: string; text: string }) => void;
  'ack:ping': (payload: { nonce: string; sentAt: number }, ack: (res: { echo: string; serverTime: number }) => void) => void;
  'debug:disconnectMe': () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SocketData {}

export const ROOMS = ['room-a', 'room-b'] as const;
export type RoomName = (typeof ROOMS)[number];
