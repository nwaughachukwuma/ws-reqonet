<p align="center">
  <img src="https://user-images.githubusercontent.com/20521315/183274641-c1512f84-d7aa-4942-913f-e8329edef00a.gif" alt="Logo" />
</p>

# wsreconnect

[![Publish](https://github.com/nwaughachukwuma/ws-rekanet/actions/workflows/publish.yml/badge.svg)](https://github.com/nwaughachukwuma/ws-rekanet/actions/workflows/publish.yml)

Simple WebSocket wrapper with reconnect logic 💫

## Motivation

> The Websocket API although effective and simple doesn't provide any reconnection logic. This library aims to solve this shortcoming by providing a mechanism to shore up `session_affinity` between the client [a web browser] and the server. It also provides a simple queue implementation where data being sent while the connection is broken are bucketed, to be relayed when connection is restored.
>
> Notes 
> 1. the library is basically a wrapper for native WebSocket class, re-exposing its API. 
> 2. it's built on browser event interface which allows it to emit native WebSocket events. 
> 3. well tested with AVA.

## 🛠 installation

```bash
# yarn
yarn add ws-rekanet

# pnpm
pnpm install ws-rekanet

# npm
npm install ws-rekanet
```

## Usage

```ts
import WSRekanet from "ws-rekanet";

const url = `ws://localhost:3001/`;
const protocols = [];
const options = {
  maxReconnectAttempts: 5,
  maxRetryAttempts: 3,
  useMessageQueue: true,
};

// initialize
const wsClient = new WSRekanet(url, protocols, options);

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

## API

### url

Type: `string`

### protocols

Type: `string | string[]`
Default: []

Either a single protocol string or an array of protocol strings. These strings are used to indicate sub-protocols, so that a single server can implement multiple WebSocket sub-protocols (for example, you might want one server to be able to handle different types of interactions depending on the specified protocol). See more [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket), [WhatWG#web-sockets](https://html.spec.whatwg.org/multipage/web-sockets.html#websocket)

### options

Type: `object`

#### maxReconnectAttempts

Type: `number`\
Default: 5

Number of times it attempts to reconnect within a retry

#### maxRetryAttempts

Type: `number`\
Default: 5

The maximum number of retries - how many attempts at reconnecting

#### useMessageQueue

Type: `boolean`\
Default: true

Whether to store 'send' data when the connection is broken, which is to be relayed when connection is restored.

#### disableReconnect

Type: `boolean`\
Default: false

Whether to disable reconnection

#### debug

Type: `boolean`\
Default: false

Whether to run in debug mode which enables logging to dev tools

### events

#### open, close, message, error

The same as native [WebSocket events](https://html.spec.whatwg.org/multipage/web-sockets.html#websocket)

#### reconnection_timeout

Indicates when reconnection attempts timeout.

#### reconnected

Emitted when reconnection attempt is successful - connection restored
