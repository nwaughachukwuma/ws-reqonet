// import WSReqonet from '../../../lib/index.js';
import WSReqonet from 'ws-reqonet';

const API_URL = 'http://localhost:8080';
export default function websocket(): WSReqonet {
	const SERVER_URL = `${API_URL.replace(/http/, 'ws')}/ws/`;
	return new WSReqonet(SERVER_URL, [], { debug: true });
}

export { WSReqonet as Websocket };
