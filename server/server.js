require('./functions.js');
global.fs = require('fs');
global.crypto = require('crypto');
global.request = require('request');
global.cp = require('child_process');
global.superConfig = require('../config.json');
global.config = superConfig.ffa
var express = require("express");

//init http server
var app = express();
if(config.https){
	var server = require('https').createServer({
		key: fs.readFileSync('../key.pem'),
		cert: fs.readFileSync('../cert.pem')
	},app);
}else{
	var server = require('http').createServer(app);
}

//server files
app.use(express.static('client'));

//start the websocket server
var WebSocketServer = require('ws').Server;

global.wss = new WebSocketServer({ 
	server: server
});

server.listen(process.env.PORT || config.port || 8080, process.env.HOST || config.host || '0.0.0.0');

//load the main game code
require('../client/common/colors.js');
require('../client/common/bison.js');
require('../client/common/optcodes.js');
require('../client/common/game.js');
require('../client/common/glob.js');

global.game = new Game(config.game);

//load the server side game code
require('./action.js');
require('./transfer.js');
require('./collision.js');
require('./tick.js');
require('./network.js');
require('./sectors.js');
require('./stats.js');
require('./socket.js');

global.connection = function(socket) {
	if(config.max <= Object.keys(game.sockets).length){
		socket.emit(optCodes['closeMsg'],'This server currently has to many players online. Please Try again later.')
		socket.ws.close();
		return;
	}
	
	socket.chatQ = false;
	socket.prevBlocks = [];
	socket.lastVisible = [];
	socket.rating = config.game.playerSize;
	socket.loaded = false;
	socket.on(optCodes['login'],function(data){
		login(socket,data)
	});
}


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.on('uncaughtException', function (err) {
	console.log(err.stack);
	if(superConfig.error.send)request.post(superConfig.error.url,{
		form: {
			key: superConfig.error.key,
			err: err,
			stack: err.stack
		}
	});
});
