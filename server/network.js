import config from '../config';
import gameMain from './game';

function localBroadcast(cords,type,message,append,loaded){
	for(let i in cords){
		let sockets = gameMain.game.listeners[cords[i].x+'_'+cords[i].y];

		if(!sockets)return ;
		for(let z in sockets){
			if(!loaded || sockets[z].loaded)(append ? sockets[z].append : sockets[z].emit)(type,message);
		}
	}
}

function sendJoin(glob,info){
	info = info || {};
	let data = {
		c: glob.color,
		u: glob.uuid,
		X: glob.vx,
		Y: glob.vy,
		r: glob.r,
		t: glob.type,
		x: Math.round(glob.x),
		y: Math.round(glob.y)
	};
	
	if(glob.name)data.name=glob.name;
	
	if(info.socket){
		(info.append ? info.socket.append : info.socket.emit)('join',data);
		return ;
	}
	
	localBroadcast(glob.toCells(config.game.blockSize),'join',data,info.append);
}

function sendRemap(glob){
	let data = {
		u: glob.uuid,
		x: Math.round(glob.x),
		y: Math.round(glob.y),
		r: glob.r,
	};
	
	localBroadcast(glob.toCells(config.game.blockSize),'remap',data,true,true);
}

function sendShoot(glob){
	let data = {
		u: glob.uuid,
		x: Math.round(glob.x),
		y: Math.round(glob.y),
		X: Math.round(glob.vx),
		Y: Math.round(glob.vy),
		r: glob.r,
	};
	
	localBroadcast(glob.toCells(config.game.blockSize),'shoot', data,true);
}

function sendLeave(data,socket){
	let uuid = typeof data === 'string' ? data : data.uuid;
	socket.append('leave',uuid);
}

export default {
	sendJoin: sendJoin,
	sendRemap: sendRemap,
	sendShoot: sendShoot,
	sendLeave: sendLeave
};