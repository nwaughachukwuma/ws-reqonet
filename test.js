import test from "ava";
import { Server } from "mock-socket";
import WSRekanet from "./lib/index.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class TestApp {
  constructor(url) {
    this.messages = [];
    this.connection = new WSRekanet(url);

    this.connection.on("message", (event) => {
      this.messages.push(event.data);
    });
  }

  sendMessage(message) {
    this.connection.send(message);
  }

  get instance() {
    return this.connection;
  }
}

const FAKE_URL = "ws://localhost:8080";
const SERVER_RESPONSE = "test message from mock server";
const CLIENT_MESSAGE = "test message from app";
const WAIT_TIME = 100;

test.serial("WSRekanet can listen on open connection", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", () => {});

  const app = new TestApp(FAKE_URL);
  app.instance.on("open", () => {
    t.pass();
  });

  await sleep(WAIT_TIME);
  mockServer.stop(t.done);
});

test.serial("WSRekanet can listen on close connection", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", (socket) => {
    socket.close();
  });

  const app = new TestApp(FAKE_URL);
  app.instance.on("close", () => {
    t.pass();
  });

  await sleep(WAIT_TIME);
  mockServer.stop(t.done);
});

test.serial("WSRekanet can listen on errored connection", async (t) => {
  const DIFF_FAKE_URL = "ws://localhost:8080/diff";

  const mockServer = new Server(DIFF_FAKE_URL);
  mockServer.on("connection", (socket) => {
    socket.close();
  });

  const app = new TestApp(FAKE_URL);
  app.instance.on("error", (error) => {
    t.is(error.type, "error");
  });

  await sleep(WAIT_TIME);
  mockServer.stop(t.done);
});

test.serial("websocket client can receive message from server", async (t) => {
  const mockServer = new Server(FAKE_URL);
  mockServer.on("connection", (socket) => {
    socket.send(SERVER_RESPONSE);
  });

  const app = new TestApp(FAKE_URL);

  await sleep(WAIT_TIME);

  t.is(app.messages.length, 1);
  t.is(app.messages[0], SERVER_RESPONSE, "server message received");

  mockServer.stop(t.done);
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

  await sleep(WAIT_TIME);
  app.sendMessage(CLIENT_MESSAGE);

  await sleep(WAIT_TIME);
  mockServer.stop(t.done);
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

    await sleep(WAIT_TIME);
    app.sendMessage(CLIENT_MESSAGE);

    await sleep(WAIT_TIME);

    t.is(app.messages.length, 1);
    t.is(app.messages[0], SERVER_RESPONSE, "subbed the websocket backend");

    mockServer.stop(t.done);
  }
);
