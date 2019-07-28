import BISON from 'bison';
import config from './config';
import express from 'express';
import optCodes from './shared/optCodes.json';
import login from './server/socket';
import http from 'http';
import gameMain from './server/game';

//init http server
let app = express();
let server = http.createServer(app);

//server files
app.use(express.static('static'));

//start the websocket server
let WebSocketServer = require('ws').Server;

let wss = new WebSocketServer({ 
	server: server
});


wss.on('connection', function(ws) {
	let socket = {
		messages:[],
		callbacks:{},
		ws: ws,
		call: function(code,payload){
			let callback = socket.callbacks[code];
			if(callback)callback(payload);
		},
		on: function(type,callback){
			socket.callbacks[optCodes[type]]= callback;
		},
		append: function(type,b){
			b = b || null;
			if(type !== undefined)socket.messages = socket.messages.concat([optCodes[type],b]);
		},
		emit: function(type,b){
			b = b || null;
			
			if(type !== undefined)socket.messages = socket.messages.concat([optCodes[type],b]);
			
			if(socket.messages.length === 0)return;
			let data = BISON.encode(socket.messages);
			
			ws.send(data,function(){});
			
			let m = socket.messages.slice();
			socket.messages = [];
			return m;
		}
	};

	connection(socket);
	
	ws.on('message', function(message) {
		
		let data = BISON.decode(message);
		if(!Array.isArray(data) || data.length % 2 === 1)return;
		for(let i=0;i<data.length;i+=2){
			socket.call(data[i],data[i+1]);
		}
	});
});


server.listen(process.env.PORT || config.port || 8080, process.env.HOST || config.host || '0.0.0.0');

//load the main game code
gameMain.game = new gameMain.Game(config.game);

//load the server side game code

// require('./server/collision');
require('./server/tick');
// require('./server/network');
// require('./server/sectors');

function connection(socket) {
	if(config.max <= Object.keys(gameMain.game.sockets).length){
		socket.emit('closeMsg', 'This server currently has to many players online. Please Try again later.');
		socket.ws.close();
		return;
	}
	
	socket.chatQ = false;
	socket.prevBlocks = [];
	socket.lastVisible = [];
	socket.rating = config.game.playerSize;
	socket.loaded = false;
	socket.on('login', payload => login(socket,payload));
}


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.on('uncaughtException', err => {
	console.log(err.stack);
});
