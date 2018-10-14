global.updateRating = function(u0,u1){
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


global.leaderboard = [];
global.board = [];

global.lastPlayers = 0;
global.sendStats = function(){
	var ratings=[];
	for(var i in game.sockets){
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
	
	top = ratings.slice(0, 10);
	
	if(JSON.stringify(top) != JSON.stringify(leaderboard)){
		board = [];
		
		
		for(var i in top){
			board.push([top[i].name,top[i].rating]);
		}
		
		for(var i in game.sockets){
			game.sockets[i].append(optCodes['leaderboard'],board);
		}
	}
	
	var players = ratings.length;
	
	if(lastPlayers != players){
		for(var i in game.sockets){
			game.sockets[i].append(optCodes['players'],players);
		}
	}
	
	for(var i in ratings){
		var rating = ratings[i];
		game.sockets[rating.uuid].append(optCodes['rank'],(i*1)+1);
	}
	leaderboard = ratings;
}

setInterval(sendStats,config.game.statUpdate);
