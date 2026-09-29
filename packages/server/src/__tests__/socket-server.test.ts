import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@socketlistenersample/shared';
import { createApp } from '../index';

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

describe('socket server', () => {
  let httpServer: ReturnType<typeof createApp>['httpServer'];
  let url: string;
  let clients: TestSocket[];

  beforeEach(async () => {
    ({ httpServer } = createApp());
    await new Promise<void>((resolve) => {
      httpServer.listen(0, resolve);
    });
    const { port } = httpServer.address() as AddressInfo;
    url = `http://localhost:${port}`;
    clients = [];
  });

  afterEach(async () => {
    for (const client of clients) client.disconnect();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  function connect(): TestSocket {
    const client: TestSocket = ioClient(url, { reconnectionDelay: 50 });
    clients.push(client);
    return client;
  }

  function once<Event extends keyof ServerToClientEvents>(
    client: TestSocket,
    event: Event,
  ): Promise<Parameters<ServerToClientEvents[Event]>[0]> {
    return new Promise((resolve) => {
      client.once(event, resolve as never);
    });
  }

  it('pushes a welcome message on connect', async () => {
    const client = connect();
    const payload = await once(client, 'welcome');
    expect(payload.message).toBe("I'm from socket");
  });

  it('broadcasts a message to every connected client, including the sender', async () => {
    const a = connect();
    const b = connect();
    await Promise.all([once(a, 'welcome'), once(b, 'welcome')]);

    const received = Promise.all([once(a, 'broadcast:message'), once(b, 'broadcast:message')]);
    a.emit('client:broadcast', { text: 'hi all' });

    const [onA, onB] = await received;
    expect(onA.text).toBe('hi all');
    expect(onB.text).toBe('hi all');
  });

  it('only delivers room messages to clients that joined the same room', async () => {
    const a = connect();
    const b = connect();
    await Promise.all([once(a, 'welcome'), once(b, 'welcome')]);

    await new Promise<void>((resolve) => {
      a.emit('room:join', { room: 'room-a' }, () => resolve());
    });
    await new Promise<void>((resolve) => {
      b.emit('room:join', { room: 'room-b' }, () => resolve());
    });

    let bReceivedCount = 0;
    b.on('room:message', () => {
      bReceivedCount += 1;
    });

    const aReceived = once(a, 'room:message');
    a.emit('room:message', { room: 'room-a', text: 'only for room-a' });

    const payload = await aReceived;
    expect(payload.text).toBe('only for room-a');

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(bReceivedCount).toBe(0);
  });

  it('acknowledges a ping with an echo and the server time', async () => {
    const client = connect();
    await once(client, 'welcome');

    const res = await new Promise<{ echo: string; serverTime: number }>((resolve) => {
      client.emit('ack:ping', { nonce: 'abc', sentAt: Date.now() }, resolve);
    });

    expect(res.echo).toBe('abc');
    expect(typeof res.serverTime).toBe('number');
  });

  it('reconnects after a server-initiated disconnect once the client reconnects manually', async () => {
    // Socket.IO only auto-reconnects after network-level drops; a server-initiated
    // disconnect ("io server disconnect") requires an explicit client.connect() call,
    // same as packages/client/src/socket/client.ts does for the real app.
    const client = connect();
    await once(client, 'welcome');

    const disconnectReason = new Promise<string>((resolve) => {
      client.once('disconnect', (reason: string) => resolve(reason));
    });
    client.emit('debug:disconnectMe');
    expect(await disconnectReason).toBeDefined();

    client.connect();
    await new Promise<void>((resolve) => {
      client.once('connect', () => resolve());
    });
    expect(client.connected).toBe(true);
  }, 10000);
});
