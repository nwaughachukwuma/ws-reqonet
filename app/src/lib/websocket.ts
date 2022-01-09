// import WSRekanet from '../../../lib/index.js';
import WSRekanet from 'ws-rekanet';

const API_URL = 'http://localhost:8080';
export default function websocket(): WSRekanet {
	const SERVER_URL = `${API_URL.replace(/http/, 'ws')}/ws/`;
	return new WSRekanet(SERVER_URL, [], { enableLogging: true });
}

export { WSRekanet as Websocket };
