import utils from './utils';
import stats from './stats';
import config from '../config';
import gameMain from './game';
import ug from 'username-generator';

function login(socket,data){
	if(typeof data !== 'object' || typeof data.name !== 'string' ||
	!utils.validNumber(data.w,0,100000) || !utils.validNumber(data.h,0,100000) || !utils.validNumber(data.c,0,360)){
		socket.ws.close();
		return ;
	}
	
	
	let client = {
		uuid: utils.uuid(),
		name: (data.name === '' ? ug.generateUsername('-') : (data.name
			.substr(0,30) //limit name to 30 characters
			.replace(/[^ -~]+/g, '') //remove non-ascii characters
			.replace(/(^\s*)|(\s*$)/gi,'') //remove whitespace
			.replace(/[ ]{2,}/gi,' ')
			.replace(/\n /,'\n')
		)).toUpperCase(),
		color: data.c,
		cam:{
			x: 0,
			y: 0,
			w: Math.min(data.w + config.game.addDim, config.game.maxDim),
			h: Math.min(data.h + config.game.addDim, config.game.maxDim)
		}
	};
	
	socket.cli = client;
	gameMain.game.sockets[client.uuid] = socket;
	
	console.log('join',new Date(),socket.ws.upgradeReq.connection.remoteAddress,client.name);
	
	// When client connects, dump game state
	socket.append('start', {
		name:client.name,
		uuid:client.uuid,
		settings: gameMain.game.settings
	});

	socket.append('leaderboard',stats.board);
	socket.append('players', stats.board.length);
	socket.emit();
	
	// Client shoots
	socket.on('shoot', function(data) {
		if(!gameMain.game.state.globs[client.uuid] || typeof data !== 'object' || !utils.validNumber(data.direction,-100,100))return ;
		gameMain.game.shoot(client.uuid, data.direction);
	});
	
	// Client joins the game as a player
	socket.on('join', function() {
		if(client.uuid in gameMain.game.state.globs)return ;
		socket.rating = config.game.playerSize;
		let data = gameMain.game.append('player',client);
		client.cam.x = data.x;
		client.cam.y = data.y;
		socket.emit('rating',socket.rating);
	});
	
	socket.on('state', function() {
		socket.lastVisible = [];
		for(let z in socket.prevBlocks){
			delete gameMain.game.listeners[socket.prevBlocks[z]][client.uuid]; 
		}
		
		socket.loaded = false;
		socket.prevBlocks = [];
		
		socket.emit('state');
	});
	
	socket.on('cam', function(data) {
		if(typeof data !== 'object' || !utils.validNumber(data.x,0,config.game.width) || !utils.validNumber(data.y,0,config.game.height))return ;
		client.cam.x = data.x;
		client.cam.y = data.y;
	});
	
	socket.on('land', function(data) {
		if(!utils.validNumber(data.w,0,100000) || !utils.validNumber(data.h,0,100000))return;
		client.cam.w = Math.min(data.w + config.game.addDim, config.game.maxDim);
		client.cam.h = Math.min(data.h + config.game.addDim, config.game.maxDim);
	});
	
	
	socket.on('chat', function(data) {
		if(socket.chatQ || typeof data !== 'string' || data === '' || data.length > 200){
			socket.append('chatE',true);
			return ;
		}
		
		chatQ.push({
			id: client.uuid,
			text: data
		});
		
		socket.append('chatQ',[chatQ.length,chatQ.length]);
		socket.chatQ = true;
	});
	
	socket.on('chatC', function() {
		for(let i in chatQ){
			if(chatQ[i].id === client.uuid)chatQ.splice(i,1);
		}
		
		socket.append('chatE', true);
		
		socket.chatQ = false;
	});
	
	socket.ws.on('close', function() {
		for(let z in socket.prevBlocks){
			delete gameMain.game.listeners[socket.prevBlocks[z]][client.uuid]; 
		}
		
		if(gameMain.game.state.globs[client.uuid])gameMain.game.leave(gameMain.game.state.globs[client.uuid]);
		delete gameMain.game.sockets[client.uuid];
		
		console.log('leave',new Date(),socket.ws.upgradeReq.connection.remoteAddress,client.name);
	});
}


let chatQ = [];

function chatTick(){
	if(chatQ.length === 0)return ;
	
	let mess = chatQ[0];
	
	if(!gameMain.game.sockets[mess.id]){
		chatQ.splice(0,1);
		return ;
	}
	
	for(let i in gameMain.game.sockets){
		let socket = gameMain.game.sockets[i];
		socket.append('chat',{
			'n': gameMain.game.sockets[mess.id].cli.name,
			'c': gameMain.game.sockets[mess.id].cli.color,
			't': mess.text
		});
	}
	
	gameMain.game.sockets[mess.id].append('chatE', true);
	gameMain.game.sockets[mess.id].chatQ = false;
	
	chatQ.splice(0,1);
	
	for(let i in chatQ){
		let mess = chatQ[i];
		let socket = gameMain.game.sockets[mess.id];
		if(!socket){
			chatQ.splice(i,1);
			continue;
		}
		
		socket.append('chatQ',[i*1 + 1,chatQ.length]);
	}
}

setInterval(chatTick,config.chatSpeed);

export default login;