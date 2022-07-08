import uws from "uWebSockets.js";

const PORT = 8080;

uws
  .App()
  .ws("/ws/*", {
    maxBackpressure: 1024,
    maxPayloadLength: 512,
    compression: uws.DEDICATED_COMPRESSOR_3KB,
    /* Handlers */
    open: (ws) => {
      /* Let this client listen to all sensor topics */
      ws.subscribe("home/sensors/#");
      console.log("uws open", ws.getRemoteAddress());
      ws.send("Connected to uws server", true);
    },
    message: (ws, message, isBinary) => {
      ws.send(message, isBinary, true);
    },
  })
  .get("/", (res, _req) => {
    res.end(JSON.stringify({ VERSION: process.env.VERSION || "local", PORT }));
  })
  .get("/*", (res, req) => {
    res
      .writeStatus("200 OK")
      .writeHeader("x-uwebsocket-header", true)
      .end("Hello there!");
  })
  .listen(PORT, (listen_r) => {
    if (listen_r) {
      console.log("Listening to server on http://0.0.0.0:" + PORT);
    } else {
      console.log("Failed to listen to port:" + PORT);
    }
  });
