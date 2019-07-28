import gameMain from './game';
import config from '../config';

let state = {
	leaderboard: [],
	board: [],
	lastPlayers: 0,
	updateRating: updateRating,
	sendStats: sendStats
};

function updateRating(u0,u1){
	let s0 = gameMain.game.sockets[u0];
	let s1 = gameMain.game.sockets[u1];
	if(!s0)return ;
	
	if(s1){
		s0.rating+=s1.rating / 2;
	}else{
		s0.rating+=gameMain.game.state.globs[u1].rating;
	} 
	s0.emit('rating',s0.rating);
}

function sendStats(){
	let ratings=[];
	for(let i in gameMain.game.sockets){
		let socket = gameMain.game.sockets[i];
		if(!gameMain.game.state.globs[socket.cli.uuid])continue;
		ratings.push({
			name: socket.cli.name,
			uuid: socket.cli.uuid,
			color: socket.cli.color,
			rating: Math.round(socket.rating)
		});
	}
	
	ratings.sort(function (a, b) {
		return b.rating - a.rating;
	});
	
	let top = ratings.slice(0, 10);
	
	if(JSON.stringify(top) !== JSON.stringify(state.leaderboard)){
		state.board = [];
		
		
		top.forEach(player =>{
			state.board.push([player.name, player.rating, player.color]);
		});
		
		for(let i in gameMain.game.sockets){
			gameMain.game.sockets[i].append('leaderboard', state.board);
		}
	}
	
	let players = ratings.length;
	
	if(state.lastPlayers !== players){
		for(let i in gameMain.game.sockets){
			gameMain.game.sockets[i].append('players', players);
		}
	}
	
	for(let i in ratings){
		let rating = ratings[i];
		gameMain.game.sockets[rating.uuid].append('rank',(i*1)+1);
	}
	state.leaderboard = ratings;
}

setInterval(sendStats,config.game.statUpdate);

export default state;