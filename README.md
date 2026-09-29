![socketio](https://user-images.githubusercontent.com/21302583/68002297-3702d980-fc8e-11e9-895a-c551767159a8.png)
# Socket io
[![Build status](https://ci.appveyor.com/api/projects/status/d2n1sbvd3bvhgfct/branch/master?svg=true)](https://ci.appveyor.com/project/Mahadenamuththa/socketlistnersample/branch/master)

[![Build history](https://buildstats.info/appveyor/chart/Mahadenamuththa/socketlistnersample)](https://ci.appveyor.com/project/Mahadenamuththa/socketlistnersample/history)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-24_LTS-339933?logo=node.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)

# Web-Socket in NodeJS
## What is a Web Socket?

Web Socket is a protocol which provides a full duplex(multiway) communication i.e allows communication in both directions simultaneously. It is a modern web technology in which there is a continuous connection between the user’s browser(client) and the server. In this type of communication, between the web server and the web browser, both of them can send messages to each other at any point in time. Traditionally in the web, we had a request/response format where a user sends an HTTP request and server responds to that. This is still applicable in most of the cases, especially those using RESTful API. But a need was felt for the server to also communicate with the client, without getting polled(or requested) by the client. The server in itself should be able to send information to the client or the browser. This is where Web Socket come into the picture.

In order to make use of the Socket in NodeJS, we first need to install a dependency that is socket.io. We can simply install it by running below command in cmd and then add this dependency to your server-side javascript file also install an express module which is basically required for server-side application

## Tech stack

- **Client**: React 19 + TypeScript, bundled/served by Vite.
- **Server**: Express 5 + Socket.IO 4, written in TypeScript and run directly with `tsx` (no build step for the server).
- **Tests**: Vitest, with React Testing Library for the client and real `socket.io-client` connections against an in-process server for the server suite.
- **CI**: AppVeyor, running on Node 24 (LTS).

## Getting started

You'll need [Node.js 24 (LTS)](https://nodejs.org/en/download/) on your machine.

```
npm install     # install dependencies
npm run dev     # start the Vite dev server (client) and the Socket.IO server together
```

`npm run dev` runs the client (`http://localhost:5173`) and the server (`http://localhost:6600`) concurrently. Open the client URL in a browser.

Other scripts:

```
npm run build     # type-check client + server, then build the client with Vite (outputs to dist/)
npm run preview   # preview the production build
npm run start:server   # run the server on its own, without watch mode
npm test          # run the full test suite once
npm run test:watch     # run tests in watch mode
npm run lint       # lint the project
```

## Project layout

```
socketlistenersample
├── README.md
├── index.html              Vite entry point
├── package.json
├── vite.config.ts          Vite + Vitest configuration
├── tsconfig.json           TypeScript config for the client
├── tsconfig.server.json    TypeScript config for the server
├── appveyor.yml
├── public
└── src
    ├── main.tsx
    ├── App.tsx              composes the feature-showcase panels
    ├── components/          one component per Socket.IO feature panel
    ├── shared/
    │   └── socket-events.ts typed event contract shared by client and server
    ├── socket/
    │   └── client.ts        the client's Socket.IO connection
    ├── server/
    │   └── index.ts         Express + Socket.IO server
    └── __tests__/
        ├── App.test.tsx
        └── server/
            └── socket-server.test.ts
```

## The server

The server exposes a typed Socket.IO API (plus a `GET /health` route) and is started via `createApp()`, which only binds a port when the file is run directly — this lets tests spin up the same server on an ephemeral port.

```ts
import { createServer as createHttpServer } from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../shared/socket-events';

export function createApp() {
  const app = express();
  app.use(cors({ origin: CLIENT_ORIGIN }));
  app.get('/health', (_req, res) => res.json({ ok: true }));

  const httpServer = createHttpServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: { origin: CLIENT_ORIGIN },
  });

  io.on('connect', (socket) => {
    socket.emit('welcome', { message: "I'm from socket", timestamp: Date.now() });
    // ...broadcast / rooms / ack / reconnect handlers, see src/server/index.ts
  });

  return { app, httpServer, io };
}
```

## Feature showcase

The client renders one panel per Socket.IO capability being demonstrated:

| Panel | Client → Server | Server → Client | What it shows |
|---|---|---|---|
| Baseline | — | `welcome` | The original behavior: the server pushes a message as soon as a client connects. |
| Broadcast | `client:broadcast` | `broadcast:message` | `io.emit(...)` fans a message out to every connected client, including the sender. Open two browser tabs to see both update. |
| Rooms | `room:join` (ack), `room:message` | `room:message` | `socket.join(room)` + `io.to(room).emit(...)` — messages only reach clients that joined the same room. |
| Ack callback | `ack:ping` (ack) | — (via callback) | A request/response round trip using Socket.IO's acknowledgement callbacks, with measured latency. |
| Reconnect | `debug:disconnectMe` | — | Forces a server-side disconnect and shows the client's built-in automatic reconnection cycling through connection states. |

The event contract for all of the above lives in `src/shared/socket-events.ts` and is imported by both the client and the server, so client and server payloads stay in sync at compile time.

## Testing

```
npm test
```

runs the whole suite once via Vitest: `src/__tests__/App.test.tsx` renders the app against a mocked socket and asserts the UI reacts correctly, and `src/__tests__/server/socket-server.test.ts` starts the real Express/Socket.IO server on an ephemeral port and drives it with real `socket.io-client` connections to verify the broadcast, rooms, ack, and reconnect behavior described above. Use `npm run test:watch` while iterating locally.
