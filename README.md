<p align="center">
  <img src="https://user-images.githubusercontent.com/20521315/183275677-b09e49c0-a381-4132-af39-d0da80dc5ab6.gif" alt="Logo" />
</p>

# ws-reqonet [formerly ws-rekanet]

[![Publish](https://github.com/nwaughachukwuma/ws-reqonet/actions/workflows/publish.yml/badge.svg)](https://github.com/nwaughachukwuma/ws-reqonet/actions/workflows/publish.yml)

Simple WebSocket wrapper with reconnect logic 💫

## Motivation

> The Websocket API although effective and simple doesn't provide any reconnection logic. This library aims to solve this shortcoming by providing a mechanism to shore up `session_affinity` between the client [a web browser] and the server. It also provides a simple queue implementation where data being sent while the connection is broken are bucketed, to be relayed when connection is restored.
>
> Notes
>
> 1. the library is basically a wrapper for native WebSocket class, re-exposing its API.
> 2. it's built on browser event interface which allows it to emit native WebSocket events.
> 3. well tested with AVA.

## 🛠 installation

```bash
# yarn
yarn add ws-reqonet

# pnpm
pnpm install ws-reqonet

# npm
npm install ws-reqonet
```

## 🔱 Usage

```ts
import WSReqonet from "ws-reqonet";

const url = `ws://localhost:3001/`;
const protocols = [];
const options = {
  maxRetryAttempts: 10,
  queueMessage: true,
};

// initialize
const wsClient = new WSReqonet(url, protocols, options);

wsClient.on("open", () => {
  console.log("websocket connection established");
});
wsClient.on("message", (event: any) => {
  console.log(event.data);
});
wsClient.on("error", (error: any) => {
  console.log("websocket error", error);
});
wsClient.on("close", () => {
  console.log("websocket connection closed");
});

const payload = { message };
wsClient.send(JSON.stringify(payload));
```

## 🎯 API

### url

Type: `string`

### protocols

Type: `string | string[]`
Default: []

Either a single protocol string or an array of protocol strings. These strings are used to indicate sub-protocols, so that a single server can implement multiple WebSocket sub-protocols (for example, you might want one server to be able to handle different types of interactions depending on the specified protocol). See more [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket), [WhatWG#web-sockets](https://html.spec.whatwg.org/multipage/web-sockets.html#websocket)

### options

Type: `object`

#### maxRetryAttempts

The maximum number of retries - how many attempts at reconnecting

Type: `number`\
Default: 5

#### queueMessage

Whether to store 'send' data when the connection is broken, which is to be relayed when connection is restored.

Type: `boolean`\
Default: true

#### disableReconnect

Whether to disable reconnection

Type: `boolean`\
Default: false

#### debug

Whether to run in debug mode which enables logging to dev tools

Type: `boolean`\
Default: false

### events

#### open, close, message, error

The same as native [WebSocket events](https://html.spec.whatwg.org/multipage/web-sockets.html#websocket)

#### reconnection_timeout

Indicates when reconnection attempts timeout.

#### reconnected

Emitted when reconnection attempt is successful - connection restored
