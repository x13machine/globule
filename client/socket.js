import optCodes from '../shared/optCodes.json';
import autoBind from 'auto-bind';
require('bison'); //need to replace with bson
let bison = window.BISON; //need to do this because the module doesn't work with webpack

class Socket {
	messages = [];
	callbacks = {};

	call(type, payload){
		let callback = this.callbacks[optCodes[type]];
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
		this.ws.send(bison.encode(this.messages));
		this.messages = [];
	}

	constructor(){
		this.uri = (location.protocol === 'http:' ? 'ws' : 'wss') + '://' + location.host;
		this.ws = new WebSocket(this.uri);
		
		this.ws.onclose = () => this.call('close');
		this.ws.onerror = () => this.call('error');
		this.ws.onopen = () => this.call('open');

		this.ws.onmessage = message => {
			var payload = bison.decode(message.data);
			if(!Array.isArray(payload) || payload.length % 2 == 1)return;
			for(let i=0;i<payload.length;i+=2){
				this.call(payload[i],payload[i+1]);
			}
		};

		autoBind(this);
	}
}
export default Socket;