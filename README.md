![socketio](https://user-images.githubusercontent.com/21302583/68002297-3702d980-fc8e-11e9-895a-c551767159a8.png)
# Socket io
[![Build status](https://ci.appveyor.com/api/projects/status/d2n1sbvd3bvhgfct/branch/master?svg=true)](https://ci.appveyor.com/project/Mahadenamuththa/socketlistnersample/branch/master)

[![Build history](https://buildstats.info/appveyor/chart/Mahadenamuththa/socketlistnersample)](https://ci.appveyor.com/project/Mahadenamuththa/socketlistnersample/history)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-24_LTS-339933?logo=node.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)

# Web-Socket in NodeJS
## What is a Web Socket?

Web Socket is a protocol which provides a full duplex(multiway) communication i.e allows communication in both directions simultaneously. It is a modern web technology in which there is a continuous connection between the user’s browser(client) and the server. In this type of communication, between the web server and the web browser, both of them can send messages to each other at any point in time. Traditionally in the web, we had a request/response format where a user sends an HTTP request and server responds to that. This is still applicable in most of the cases, especially those using RESTful API. But a need was felt for the server to also communicate with the client, without getting polled(or requested) by the client. The server in itself should be able to send information to the client or the browser. This is where Web Socket come into the picture.

In order to make use of the Socket in NodeJS, we first need to install a dependency that is socket.io. We can simply install it by running below command in cmd and then add this dependency to your server-side javascript file also install an express module which is basically required for server-side application

## Tech stack

- **Monorepo**: npm workspaces + [Turborepo](https://turborepo.com) for task orchestration across packages.
- **Client** (`packages/client`): React 19 + TypeScript, bundled/served by Vite.
- **Server** (`packages/server`): Express 5 + Socket.IO 4, written in TypeScript and run directly with `tsx` (no build step for the server).
- **Shared** (`packages/shared`): the Socket.IO event contract (`ServerToClientEvents`/`ClientToServerEvents`), imported by both client and server so payloads stay in sync at compile time.
- **Tests**: Vitest in each package — React Testing Library for the client, real `socket.io-client` connections against an in-process server for the server suite.
- **CI**: AppVeyor, running on Node 24 (LTS).

## Getting started

You'll need [Node.js 24 (LTS)](https://nodejs.org/en/download/) on your machine.

```
npm install     # installs dependencies for every package in the workspace
npm run dev     # start the client and server dev servers together, via turbo
```

`npm run dev` runs the client (`http://localhost:5173`) and the server (`http://localhost:6600`) in parallel. Open the client URL in a browser.

Other root-level scripts (each fans out to every package via Turborepo):

```
npm run build   # type-check + build every package (client's Vite build lands in packages/client/dist)
npm test        # run every package's test suite once
npm run lint    # lint the whole workspace from a single root ESLint config
```

Scripts scoped to one package (run from that package's directory, or via `npm run <script> --workspace=<name>`):

```
npm run dev --workspace=@socketlistenersample/client     # client only
npm run dev --workspace=@socketlistenersample/server      # server only
npm run start --workspace=@socketlistenersample/server    # run the server once, without watch mode
npm run preview --workspace=@socketlistenersample/client  # preview the production client build
```

## Project layout

```
socketlistenersample
├── README.md
├── appveyor.yml
├── package.json              workspaces: ["packages/*"], root scripts delegate to turbo
├── turbo.json                 task pipeline (build/test/dev)
├── tsconfig.base.json         shared TypeScript compiler options, extended by each package
├── eslint.config.js            single flat config, lints every package from the root
└── packages/
    ├── shared/
    │   ├── package.json        @socketlistenersample/shared — no build step, consumed as TS source
    │   └── src/socket-events.ts
    ├── server/
    │   ├── package.json        @socketlistenersample/server
    │   ├── vitest.config.ts     Node test environment
    │   └── src/
    │       ├── index.ts         Express + Socket.IO server, exports createApp()
    │       └── __tests__/socket-server.test.ts
    └── client/
        ├── package.json        @socketlistenersample/client
        ├── index.html           Vite entry point
        ├── vite.config.ts        Vite + Vitest configuration (jsdom environment)
        ├── public/
        └── src/
            ├── main.tsx, App.tsx  composes the feature-showcase panels
            ├── components/        one component per Socket.IO feature panel
            ├── socket/client.ts   the client's Socket.IO connection
            └── __tests__/App.test.tsx
```

## The server

The server (`packages/server/src/index.ts`) exposes a typed Socket.IO API (plus a `GET /health` route) and is started via `createApp()`, which only binds a port when the file is run directly — this lets tests spin up the same server on an ephemeral port.

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
} from '@socketlistenersample/shared';

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
    // ...broadcast / rooms / ack / reconnect handlers, see packages/server/src/index.ts
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
| Reconnect | `debug:disconnectMe` | — | Forces a server-side disconnect. Socket.IO doesn't auto-reconnect after a *server-initiated* disconnect, so the client explicitly detects that reason and reconnects manually — the panel shows the connection status and last disconnect reason as it happens. |

The event contract for all of the above lives in `packages/shared/src/socket-events.ts` and is imported by both `packages/client` and `packages/server` as the `@socketlistenersample/shared` workspace package, so client and server payloads stay in sync at compile time.

## Testing

```
npm test
```

runs every package's suite once via Vitest (in parallel, orchestrated by Turborepo): `packages/client/src/__tests__/App.test.tsx` renders the app against a mocked socket and asserts the UI reacts correctly, and `packages/server/src/__tests__/socket-server.test.ts` starts the real Express/Socket.IO server on an ephemeral port and drives it with real `socket.io-client` connections to verify the broadcast, rooms, ack, and reconnect behavior described above.
