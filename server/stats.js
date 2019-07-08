var optCodes = require('../shared/optCodes');
var {game} =require('../shared/game');
var config = require('../config');

var state = {
	leaderboard: [],
	board: [],
	lastPlayers: 0,
	updateRating: updateRating,
	sendStats: sendStats
};

function updateRating(u0,u1){
	var s0 = game.sockets[u0];
	var s1 = game.sockets[u1];
	if(!s0)return ;
	
	if(s1){
		s0.rating+=s1.rating / 2;
	}else{
		s0.rating+=game.state.globs[u1].rating;
	} 
	s0.emit(optCodes['rating'],s0.rating);
}

function sendStats(){
	var ratings=[];
	for(let i in game.sockets){
		var socket = game.sockets[i];
		if(!game.state.globs[socket.cli.uuid])continue;
		ratings.push({
			name: socket.cli.name,
			uuid: socket.cli.uuid,
			rating: Math.round(socket.rating)
		});
	}
	
	ratings.sort(function (a, b) {
		return b.rating - a.rating;
	});
	
	var top = ratings.slice(0, 10);
	
	if(JSON.stringify(top) != JSON.stringify(state.leaderboard)){
		state.board = [];
		
		
		for(let i in top){
			state.board.push([top[i].name,top[i].rating]);
		}
		
		for(let i in game.sockets){
			game.sockets[i].append(optCodes['leaderboard'],state.board);
		}
	}
	
	var players = ratings.length;
	
	if(state.lastPlayers != players){
		for(let i in game.sockets){
			game.sockets[i].append(optCodes['players'],players);
		}
	}
	
	for(let i in ratings){
		var rating = ratings[i];
		game.sockets[rating.uuid].append(optCodes['rank'],(i*1)+1);
	}
	state.leaderboard = ratings;
}

setInterval(sendStats,config.game.statUpdate);

module.exports = state;