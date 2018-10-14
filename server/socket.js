global.login = function(socket,data){
	if(typeof data != 'object' || typeof data.name != "string" ||
	!validNumber(data.w,0,100000) || !validNumber(data.h,0,100000) ||
	!validNumber(data.r,0,255) || !validNumber(data.g,0,255) || !validNumber(data.b,0,255)){
		socket.ws.close();
		return ;
	}
	
	var name = data.name.substr(0,30);//limit to 30 characters
	
	var name = name.replace(/[^\x00-\x7F]/g, "");//remove non-ascii characters
	
	var name = name.replace(/(^\s*)|(\s*$)/gi,"").replace(/[ ]{2,}/gi," ").replace(/\n /,"\n"); //remove whitespace
	
	var client = {
		uuid: uuid(),
		name: name.toUpperCase(),
		color: [~~data.r, ~~data.g, ~~data.b],
		cam:{
			x: 0,
			y: 0,
			w: Math.min(data.w + config.game.addDim, config.game.maxDim),
			h: Math.min(data.h + config.game.addDim, config.game.maxDim)
		}
	}
	
	socket.cli = client;
	game.sockets[client.uuid] = socket;
	
	console.log('join',new Date(),socket.ws.upgradeReq.connection.remoteAddress,client.name);
	// When client connects, dump game state
	
	socket.append(optCodes['leaderboard'],board);
	socket.append(optCodes['players'],board.length);
	
	var m = socket.emit(optCodes['start'], {
		name:client.name,
		uuid:client.uuid,
		settings: game.settings
	});
	
	// Client shoots
	socket.on(optCodes['shoot'], function(data) {
		if(!game.state.globs[client.uuid] || typeof data != 'object' || !validNumber(data.direction,-100,100))return ;
		game.shoot(client.uuid, data.direction);
	});
	
	// Client joins the game as a player
	socket.on(optCodes['join'], function() {
		if(game.state.globs[client.uuid])return ;
		socket.rating = config.game.playerSize;
		var data = game.append('player',client);
		client.cam.x = data.x;
		client.cam.y = data.y;
		socket.emit(optCodes['rating'],socket.rating);
	});
	
	socket.on(optCodes['state'], function() {
		socket.lastVisible = [];
		for(var z in socket.prevBlocks){
			delete game.listeners[socket.prevBlocks[z]][client.uuid]; 
		}
		
		socket.loaded = false;
		socket.prevBlocks = [];
		
		socket.emit(optCodes['state']);
	});
	
	socket.on(optCodes['cam'], function(data) {
		if(typeof data != 'object' || !validNumber(data.x,0,config.game.width) || !validNumber(data.y,0,config.game.height))return ;
		client.cam.x = data.x;
		client.cam.y = data.y;
	});
	
	socket.on(optCodes['land'], function(data) {
		if(!validNumber(data.w,0,100000) || !validNumber(data.h,0,100000))return;
		client.cam.w = Math.min(data.w + config.game.addDim, config.game.maxDim);
		client.cam.h = Math.min(data.h + config.game.addDim, config.game.maxDim);
	});
	
	
	socket.on(optCodes['chat'], function(data) {
		if(socket.chatQ || typeof data != 'string' || data == '' || data.length > 200){
			socket.append(optCodes['chatE'],true);
			return ;
		}
		
		chatQ.push({
			id: client.uuid,
			text: data
		});
		
		socket.append(optCodes['chatQ'],[chatQ.length,chatQ.length]);
		socket.chatQ = true;
	});
	
	socket.on(optCodes['chatC'], function(data) {
		for(var i in chatQ){
			if(chatQ[i].id == client.uuid)chatQ.splice(i,1);
		}
		
		socket.append(optCodes['chatE'],true);
		
		socket.chatQ = false;
	});
	
	socket.ws.on('close', function() {
		for(var z in socket.prevBlocks){
			delete game.listeners[socket.prevBlocks[z]][client.uuid]; 
		}
		
		if(game.state.globs[client.uuid])game.leave(game.state.globs[client.uuid]);
		delete game.sockets[client.uuid];
		
		console.log('leave',new Date(),socket.ws.upgradeReq.connection.remoteAddress,client.name);
	});
}


var chatQ = [];

function chatTick(){
	if(chatQ.length == 0)return ;
	
	var mess = chatQ[0];
	
	if(!game.sockets[mess.id]){
		chatQ.splice(0,1);
		return ;
	}
	
	for(var i in game.sockets){
		var socket = game.sockets[i];
		socket.append(optCodes['chat'],{
			'n': game.sockets[mess.id].cli.name,
			'c': game.sockets[mess.id].cli.color,
			't': mess.text
		});
	}
	
	game.sockets[mess.id].append(optCodes['chatE'],true);
	game.sockets[mess.id].chatQ = false;
	
	chatQ.splice(0,1);
	
	for(var i in chatQ){
		var mess = chatQ[i];
		var socket = game.sockets[mess.id];
		if(!socket){
			chatQ.splice(i,1);
			continue;
		}
		
		socket.append(optCodes['chatQ'],[i*1 + 1,chatQ.length]);
	}
}

setInterval(chatTick,1000);
