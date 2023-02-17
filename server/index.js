import fastify from "fastify";
import cors from "@fastify/cors";
import fastifyWS from "@fastify/websocket";

const PORT = 8080;
const ADDRESS = "0.0.0.0";
const getEnvDetails = () => ({
  VERSION: process.env.VERSION || "local",
  PORT,
});

fastify()
  .register(cors, { origin: true })
  .register(fastifyWS)
  .setErrorHandler((error, _req, reply) => {
    console.log("error", error.toString());
    reply.send({ error: "Something went wrong" });
  })
  .setNotFoundHandler((req, reply) => {
    console.log("not found", req.url);
    reply.status(404).send({ error: "Not found" });
  })
  .register(async (app) => {
    app.get("/", async () => getEnvDetails());

    app.get("/ws/*", { websocket: true }, ({ socket }, req) => {
      socket.on("message", (msg) => {
        console.log("from client", msg.toString(), req.url);
        const res = JSON.stringify({
          pong: `acked: ${Date.now()}`,
          msg: `${msg}`,
        });
        socket.send(res);
      });
    });
  })
  .listen({ port: PORT, host: ADDRESS })
  .then((v) => {
    console.log(`ws server started on ${v}`);
  });
