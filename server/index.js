import fastify from 'fastify'
import cors from 'fastify-cors'
import fastifyWS from 'fastify-websocket'

const PORT = 8080
const ADDRESS = '0.0.0.0'
const getEnvDetails = () => ({
    VERSION: process.env.VERSION || 'local',
})

fastify()
    .register(cors, {
      origin: true,
      credentials: true,
    })
    .register(fastifyWS)
    .setErrorHandler((error, _req, reply) => {
      console.log('error', error.toString())
      reply.send({ error: 'Something went wrong' })
    })
    .get('/', async () => getEnvDetails())
    .get('/ws/*', { websocket: true }, (conn, req) => {
      conn.socket.on('message', (msg) => {
        console.log('from client', msg.toString(), req.url)
        const res = JSON.stringify({
          pong: `Hi from the server: ${msg}`,
        })
        conn.socket.send(res)
      })
    })
    .listen(PORT, ADDRESS)
    .then((v) => {
      console.log(`ws server started on ${v}`)
    })
