global.sectorTick = function(){
	var globs = game.state.globs;
	for(var i in game.sockets){
		var socket = game.sockets[i];
		var client = socket.cli;
		
		//clear data
		for(var z in socket.prevBlocks){
			delete game.listeners[socket.prevBlocks[z]][client.uuid]; 
		}
		socket.prevBlocks = [];
		//get visible space
		var cells = rect2cells({
			x: Math.min(Math.max(client.cam.x - client.cam.w / 2, 0), game.settings.width - client.cam.w),
			y: Math.min(Math.max(client.cam.y - client.cam.h / 2, 0), game.settings.height - client.cam.h),
			w: client.cam.w,
			h: client.cam.h
		},game.settings.blockSize);
		
		//get globs in visible space
		var visible = [];
		if(game.state.globs[i])visible.push(i);
		
		for(var z in cells){
			var cord = cells[z].x+'_'+cells[z].y;
			socket.prevBlocks.push(cord);
			game.listeners[cord] = game.listeners[cord] || {};
			game.listeners[cord][client.uuid] = socket
			if(game.blockCall[cord])visible = visible.concat(Object.keys(game.blockCall[cord]));
		}
		
		//remove duplicates uuids
		visible = visible.filter(function(item, pos) {
			return visible.indexOf(item) == pos;
		});
		
		//send leaves
		for(var z in socket.lastVisible){
			var uuid = socket.lastVisible[z];
			if(visible.indexOf(uuid) != -1)continue;
			sendLeave(uuid,socket);
		}
		
		//send joins
		for(var z in visible){
			var uuid = visible[z];
			if(socket.lastVisible.indexOf(uuid) != -1)continue;
			sendJoin(globs[uuid],{
				socket:socket,
				append:true
			});
		}
		
		socket.lastVisible = visible;
		socket.loaded = true;
	}
}
