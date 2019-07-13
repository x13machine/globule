import BISON from 'bison';
import fs from 'fs';
import config from './config';
import express from 'express';
import optCodes from './shared/optCodes.json';
import login from './server/socket';
import http from 'http';

//init http server
var app = express();
var server = http.createServer(app);

//server files
app.use(express.static('static'));

//start the websocket server
var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({ 
	server: server
});


wss.on('connection', function(ws) {
	var socket = {
		messages:[],
		callbacks:{},
		ws: ws,
		call: function(type,data){
			var callback = socket.callbacks[type];
			if(callback)callback(data);
		},
		on: function(type,callback){
			socket.callbacks[type]=callback;
		},
		append: function(a,b){
			b = b || null;
			if(a !== undefined)socket.messages = socket.messages.concat([a,b]);
		},
		emit: function(a,b){
			b = b || null;
			
			if(a !== undefined)socket.messages = socket.messages.concat([a,b]);
			
			if(socket.messages.length == 0)return;
			var data = BISON.encode(socket.messages);
			
			ws.send(data,function(){});
			
			var m = socket.messages.slice();
			socket.messages = [];
			return m;
		}
	};

	connection(socket);
	
	ws.on('message', function(message) {
		
		var data = BISON.decode(message);
		if(!Array.isArray(data) || data.length % 2 == 1)return;
		for(let i=0;i<data.length;i+=2){
			socket.call(data[i],data[i+1]);
		}
	});
});


server.listen(process.env.PORT || config.port || 8080, process.env.HOST || config.host || '0.0.0.0');

//load the main game code
require('./shared/colors');
var gameMain = require('./server/game');
gameMain.game = new gameMain.Game(config.game);

//load the server side game code
require('./server/collision');
require('./server/tick');
require('./server/network');
require('./server/sectors');

function connection(socket) {
	if(config.max <= Object.keys(gameMain.game.sockets).length){
		socket.emit(optCodes['closeMsg'],'This server currently has to many players online. Please Try again later.');
		socket.ws.close();
		return;
	}
	
	socket.chatQ = false;
	socket.prevBlocks = [];
	socket.lastVisible = [];
	socket.rating = config.game.playerSize;
	socket.loaded = false;
	socket.on(optCodes['login'], (data) => {
		login(socket,data);
	});
}


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.on('uncaughtException', (err) => {
	console.log(err.stack);
});
