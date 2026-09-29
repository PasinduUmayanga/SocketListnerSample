import { createServer as createHttpServer } from 'http';
import { pathToFileURL } from 'url';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@socketlistenersample/shared';

const PORT = Number(process.env.PORT ?? 6600);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

export function createApp() {
  const app = express();
  app.use(cors({ origin: CLIENT_ORIGIN }));
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  const httpServer = createHttpServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: { origin: CLIENT_ORIGIN },
  });

  io.on('connect', (socket) => {
    // Baseline: push a message once on connect.
    socket.emit('welcome', { message: "I'm from socket", timestamp: Date.now() });

    // Broadcast: relay to every connected client, including the sender.
    socket.on('client:broadcast', ({ text }) => {
      io.emit('broadcast:message', { from: socket.id, text, timestamp: Date.now() });
    });

    // Rooms: join a room (ack-confirmed) and send messages scoped to that room.
    socket.on('room:join', ({ room }, ack) => {
      socket.join(room);
      ack({ ok: true, room });
    });
    socket.on('room:message', ({ room, text }) => {
      io.to(room).emit('room:message', { room, from: socket.id, text, timestamp: Date.now() });
    });

    // Ack callback: round-trip request/response.
    socket.on('ack:ping', ({ nonce }, ack) => {
      ack({ echo: nonce, serverTime: Date.now() });
    });

    // Reconnect: let the client force a server-side disconnect to observe reconnection.
    socket.on('debug:disconnectMe', () => {
      socket.disconnect(true);
    });
  });

  return { app, httpServer, io };
}

const isMainModule = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const { httpServer } = createApp();
  httpServer.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });
}
