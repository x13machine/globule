import collision from '../shared/collision';
import gameMain from './game';
import network from './network';

function sectorTick(){
	let globs = gameMain.game.state.globs;
	for(let i in gameMain.game.sockets){
		let socket = gameMain.game.sockets[i];
		let client = socket.cli;
		
		//clear data
		for(let z in socket.prevBlocks){
			delete gameMain.game.listeners[socket.prevBlocks[z]][client.uuid]; 
		}
		socket.prevBlocks = [];
		//get visible space
		let cells = collision.rect2cells({
			x: Math.min(Math.max(client.cam.x - client.cam.w / 2, 0), gameMain.game.settings.width - client.cam.w),
			y: Math.min(Math.max(client.cam.y - client.cam.h / 2, 0), gameMain.game.settings.height - client.cam.h),
			w: client.cam.w,
			h: client.cam.h
		},gameMain.game.settings.blockSize);
		
		//get globs in visible space
		let visible = [];
		if(gameMain.game.state.globs[i])visible.push(i);
		
		for(let z in cells){
			let cord = cells[z].x+'_'+cells[z].y;
			socket.prevBlocks.push(cord);
			gameMain.game.listeners[cord] = gameMain.game.listeners[cord] || {};
			gameMain.game.listeners[cord][client.uuid] = socket;
			if(gameMain.game.blockCall[cord])visible = visible.concat(Object.keys(gameMain.game.blockCall[cord]));
		}
		
		//remove duplicates uuids
		visible = visible.filter(function(item, pos) {
			return visible.indexOf(item) === pos;
		});
		
		//send leaves
		for(let z in socket.lastVisible){
			let uuid = socket.lastVisible[z];
			if(visible.indexOf(uuid) !== -1)continue;
			network.sendLeave(uuid,socket);
		}
		
		//send joins
		for(let z in visible){
			let uuid = visible[z];
			if(socket.lastVisible.indexOf(uuid) !== -1)continue;
			network.sendJoin(globs[uuid],{
				socket:socket,
				append:true
			});
		}
		
		socket.lastVisible = visible;
		socket.loaded = true;
	}
}

export default sectorTick;