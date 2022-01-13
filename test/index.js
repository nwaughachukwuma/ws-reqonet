import test from "ava";
import { Server } from "mock-socket";
import WSRekanet from "../lib/index.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class TestApp {
  #messages;
  #wsClient;
  constructor(url) {
    this.#messages = [];
    this.#wsClient = new WSRekanet(url);

    this.#wsClient.on("message", (event) => {
      this.#messages.push(event.data);
    });
  }

  sendMessage(message) {
    this.#wsClient.send(message);
  }

  get messages() {
    return this.#messages;
  }

  get ws() {
    return this.#wsClient;
  }
}

const FAKE_URL = "ws://localhost:8080";
const SERVER_RESPONSE = "test message from mock server";
const CLIENT_MESSAGE = "test message from app";
const SLEEP_DURATION = 100;

test.serial("WSRekanet can listen on open connection", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", () => {});

  const app = new TestApp(FAKE_URL);
  app.ws.on("open", () => {
    t.pass();
  });

  await sleep(SLEEP_DURATION);
  mockServer.stop();
});

test.serial("WSRekanet can listen on close connection", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", (socket) => {
    socket.close();
  });

  const app = new TestApp(FAKE_URL);
  app.ws.on("close", () => {
    t.pass();
  });

  await sleep(SLEEP_DURATION);
  mockServer.stop();
});

test.serial("WSRekanet can force close client connection", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", () => {});

  const app = new TestApp(FAKE_URL);

  await sleep(SLEEP_DURATION);
  t.is(app.ws.isOpen(), true);

  app.ws.close();

  await sleep(SLEEP_DURATION);
  t.not(app.ws.isOpen(), true);

  mockServer.stop();
});

test.serial(
  "WSRekanet does not emit 'close' when force close client",
  async (t) => {
    // indicate that only one assertion is expected
    t.plan(1);

    const mockServer = new Server(FAKE_URL);
    mockServer.on("connection", () => {});

    const app = new TestApp(FAKE_URL);
    app.ws.on("close", () => {
      t.fail();
    });

    await sleep(SLEEP_DURATION);
    app.ws.close();

    await sleep(SLEEP_DURATION);
    t.pass();

    mockServer.stop();
  }
);

test.serial("WSRekanet can listen on errored connection", async (t) => {
  const DIFF_FAKE_URL = "ws://localhost:8080/diff";

  const mockServer = new Server(DIFF_FAKE_URL);
  mockServer.on("connection", () => {});

  const app = new TestApp(FAKE_URL);
  app.ws.on("error", (error) => {
    t.is(error.type, "error");
  });

  await sleep(SLEEP_DURATION);
  mockServer.stop();
});

test.serial("WSRekanet can handle reconnect to server", async (t) => {
  t.plan(5);

  let mockServer = new Server(FAKE_URL);
  mockServer.on("connection", () => {
    t.pass("initial connection established");
  });

  const app = new TestApp(FAKE_URL);
  app.ws.on("close", () => {
    t.pass("clean close from server");
  });

  await sleep(SLEEP_DURATION);
  mockServer.close();
  t.not(app.ws.isOpen(), true);
  // --------------------------------------------------
  // attempt to reconnect to server
  // --------------------------------------------------
  // reopen the server connection
  mockServer = new Server(FAKE_URL);
  app.ws.on("reconnected", () => {
    t.pass("reconnection was successful");
  });
  // wait enough time for reconnection attempts to kick in
  await sleep(SLEEP_DURATION * 30);
  t.is(app.ws.isOpen(), true);
  mockServer.stop();
});

test.serial("WSRekanet client can relay queued sent messages", async (t) => {
  t.plan(3);

  let mockServer = new Server(FAKE_URL);
  const app = new TestApp(FAKE_URL);
  await sleep(SLEEP_DURATION);

  mockServer.close();

  t.not(app.ws.isOpen(), true);

  app.ws.send("test message 1");
  app.ws.send("test message 2");
  app.ws.send("test message 3");
  // --------------------------------------------------
  // attempt to reconnect to server
  // --------------------------------------------------
  // reopen the server connection
  mockServer = new Server(FAKE_URL);
  // add on connection listener
  mockServer.on("connection", (socket) => {
    socket.on("message", (data) => {
      socket.send(data); // send back to the client as acknowledgement
    });
  });
  // wait enough time for reconnection attempts to kick in
  await sleep(SLEEP_DURATION * 30);

  t.is(app.ws.isOpen(), true);
  t.is(app.messages.length, 3, "confirm that three message were received");
  mockServer.stop();
});

test.serial("websocket client can receive message from server", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", (socket) => {
    socket.send(SERVER_RESPONSE);
  });

  const app = new TestApp(FAKE_URL);

  await sleep(SLEEP_DURATION);

  t.is(app.messages.length, 1);
  t.is(app.messages[0], SERVER_RESPONSE, "server message received");

  mockServer.stop();
});

test.serial("websocket server can receive message from client", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", (socket) => {
    socket.on("message", (data) => {
      t.is(
        data,
        CLIENT_MESSAGE,
        "intercepted the message and can assert on it"
      );
    });
  });

  const app = new TestApp(FAKE_URL);

  await sleep(SLEEP_DURATION);
  app.sendMessage(CLIENT_MESSAGE);

  await sleep(SLEEP_DURATION);
  mockServer.stop();
});

test.serial(
  "websocket client & server can have 2-way communication",
  async (t) => {
    const mockServer = new Server(FAKE_URL);
    mockServer.on("connection", (socket) => {
      socket.on("message", (data) => {
        t.is(
          data,
          CLIENT_MESSAGE,
          "intercepted the message and can assert on it"
        );

        socket.send(SERVER_RESPONSE);
      });
    });

    const app = new TestApp(FAKE_URL);

    await sleep(SLEEP_DURATION);
    app.sendMessage(CLIENT_MESSAGE);

    await sleep(SLEEP_DURATION);

    t.is(app.messages.length, 1);
    t.is(app.messages[0], SERVER_RESPONSE, "subbed the websocket backend");

    mockServer.stop();
  }
);
