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
			//console.log('type',getKeyByValue(optCodes,a));
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
	}

	connection(socket);
	
	ws.on('message', function(message) {
		
		var data = BISON.decode(message);
		if(!Array.isArray(data) || data.length % 2 == 1)return;
		for(var i=0;i<data.length;i+=2){
			socket.call(data[i],data[i+1]);
		}
	});
});


global.localBroadcast = function(cords,type,message,append,loaded){
	
	for(var i in cords){
		var sockets = game.listeners[cords[i].x+'_'+cords[i].y];

		if(!sockets)return ;
		for(var z in sockets){
			if(!loaded || sockets[z].loaded)(append ? sockets[z].append : sockets[z].emit)(type,message);
		}
	}
}

global.sendJoin = function(glob,info){
	var info = info || {};
	var data = {
		c: glob.color,
		u: glob.uuid,
		X: glob.vx,
		Y: glob.vy,
		r: glob.r,
		t: glob.type,
		x: Math.round(glob.x),
		y: Math.round(glob.y)
	}
	
	if(glob.name)data.name=glob.name;
	
	if(info.socket){
		(info.append ? info.socket.append : info.socket.emit)(optCodes['join'],data);
		return ;
	}
	
	localBroadcast(glob.toCells(config.game.blockSize),optCodes['join'],data,info.append);
}

global.sendRemap = function(glob){
	var data = {
		u: glob.uuid,
		x: Math.round(glob.x),
		y: Math.round(glob.y),
		r: glob.r,
	}
	
	localBroadcast(glob.toCells(config.game.blockSize),optCodes['remap'],data,true,true);
}

global.sendShoot = function(glob){
	var data = {
		u: glob.uuid,
		x: Math.round(glob.x),
		y: Math.round(glob.y),
		X: Math.round(glob.vx),
		Y: Math.round(glob.vy),
		r: glob.r,
	}
	
	localBroadcast(glob.toCells(config.game.blockSize),optCodes['shoot'],data,true);
}

global.sendLeave = function(data,socket){
	var uuid = typeof data == 'string' ? data : data.uuid;
	socket.append(optCodes['leave'],uuid);
}
