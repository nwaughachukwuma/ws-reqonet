import {createServer} from 'https'
import WebSocket, { WebSocketServer } from 'ws';

const PORT = 8080
const HOST = '0.0.0.0'
const server  = createServer()

const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
    ws.send('Hello from server!');
    ws.on('message', function message(data) {
        console.log('received: %s', data);
        ws.send('message acked: ' + data);
    });
})

server.listen(PORT, HOST, () => {
    console.log('started server on port ' + PORT)
})