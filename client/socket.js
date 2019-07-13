import BISON from 'bison';
import optCodes from '../shared/optCodes.json';

class Socket {
	messages = [];
	callbacks = {};

	call(type, payload){
		let callback = this.callbacks[type];
		if(callback)callback(payload);
	}

	on(type, callback) {
		this.callbacks[optCodes[type]] = callback;
	}

	append(a, b = null) {
		if(a)this.messages = this.messages.concat([optCodes[a],b]);
	}

	emit(a, b = null) {
		if(a)this.messages = this.messages.concat([optCodes[a],b]);
		this.ws.send(BISON.encode(this.messages));
		this.messages = [];
	}

	constructor(host){
		this.uri = location.protocol + '//' + (host  || location.host);
		this.ws = new WebSocket(this.uri);
		
		this.ws.onclose = () => this.call('close');
		this.ws.onerror = () => this.call('error');
		this.ws.onopen = () => this.call('open');

		this.ws.onmessage = message => {
			var payload = BISON.decode(message.data);
			if(!Array.isArray(payload) || payload.length % 2 == 1)return;
			for(let i=0;i<payload.length;i+=2){
				this.call(payload[i],payload[i+1]);
			}
		};

	}
}
export default Socket;