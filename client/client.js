var optCodes = require('../shared/optCodes');
var utils = require('./utils');
var gameMain = require('./Game');
var CanvasRenderer = require('./CanvasRenderer'); 
var connect = require('./network');

function start(){
	document.querySelector('#play').onclick = undefined;
	document.querySelector('#spectate').onclick = undefined;
	document.querySelector('#connecting').style.display = 'block';
	var id = this.id;
	begin(id);
}


function begin(mode){
	var name=document.querySelector('#nick').value;
	sessionStorage.nick=name;
	document.querySelector('#game').style.display = 'block';
	document.querySelector('#home').style.display = 'none';
	document.querySelector('#canvas').style.display = 'block';
	var socket = connect();
	var fail = false;
	gameMain.game = new gameMain.Game({
		rating: null,
		uuid: null
	});
	gameMain.game.socket = socket;

	
	var render = new CanvasRenderer(gameMain.game);
	// Start the renderer.
	render.render();
		
	socket.ws.onopen = function(){
		socket.emit(optCodes['login'],{
			name:name,
			w: innerWidth,
			h: innerHeight,
			c: sessionStorage.color * 1
		});
	};
	
	document.querySelector('#deadClose').onclick = function(){
		document.querySelector('#deadMenu').style.display='none';
	};
	
	// Get the initial game state
	socket.on(optCodes['start'], function(data) {
		document.querySelector('#chatToggle').style.display = 'inline-block';
		document.querySelector('#join').style.display = 'inline-block';
		function join(){
			socket.emit(optCodes['join']);
		}
		
		document.querySelector('#join').onclick = join;
		document.querySelector('#respawn').onclick = join;
		
		//clone data
		gameMain.game.uuid = data.uuid;
		gameMain.game.name = data.name;
		gameMain.game = new gameMain.Game(data.settings);
		render.game = gameMain.game;
		gameMain.game.socket = socket;
		render.started = true;
		
		if (mode != 'spectate') {
			socket.emit(optCodes['join']);
			document.querySelector('#join').style.display = 'none';
		}
		
	});
	
	// A new client joins.
	socket.on(optCodes['join'], function(data) {
		if(data.u == gameMain.game.uuid){
			document.querySelector('#join').style.display = 'none';
			document.querySelector('#deadMenu').style.display = 'none';
			render.zoom = 1;
			document.querySelector('#canvas').style.cursor = 'default';
		}
		
		data.vx = data.X;
		data.vy = data.Y;
		data.type = data.t;
		data.color = data.c;
		data.uuid = data.u;
		gameMain.game.join(data);
	});
	
	socket.on(optCodes['remap'], function(data) {
		try{
			gameMain.game.state.globs[data.u].x = data.x;
			gameMain.game.state.globs[data.u].y = data.y;
			gameMain.game.state.globs[data.u].r = data.r;
		}catch(err){
			//console.log('remap',err,data)
		}
	});
	
	socket.on(optCodes['shoot'], function(data) {
		gameMain.game.state.globs[data.u].r = data.r;
		gameMain.game.state.globs[data.u].x = data.x;
		gameMain.game.state.globs[data.u].y = data.y;
		gameMain.game.state.globs[data.u].vx = data.X;
		gameMain.game.state.globs[data.u].vy = data.Y;
	});
	
	socket.on(optCodes['rating'],function(data){
		gameMain.game.rating = data;
	});
	
	socket.on(optCodes['players'],function(data){
		render.players = data;
	});
	
	socket.on(optCodes['rank'],function(data){
		render.rank = data;
	});
	
	socket.on(optCodes['closeMsg'],function(data){
		document.querySelector('#closeMsg').innerHTML = utils.text2html(data);
	});
	
	socket.on(optCodes['leaderboard'],function(data){
		var html='';
		for(let i in data){
			html+= (~~i+1) +') ';
			html+= utils.text2html(data[i][0] || 'NO NAME');
			html+= ' - ' + Math.round(data[i][1]) + '<br>';
		}
		
		document.querySelector('#leaderboard').innerHTML = html;
	});
	
	socket.on(optCodes['state'],function(){
		gameMain.game.state.globs = {};
	});
	
	// A client leaves.
	socket.on(optCodes['leave'], function(data) {
		gameMain.game.leave(gameMain.game.state.globs[data]);
		if(data == gameMain.game.uuid){
			var score = Math.round(gameMain.game.rating);
			document.querySelector('#join').style.display = 'inline-block';
			document.querySelector('#deadMenu').style.display = 'block';
			document.querySelector('#deadScore').innerHTML = 'Score: '+ score;
			document.querySelector('#deadMessage').innerHTML = '';
			render.players--;
			gameMain.game.rating = null;
		}
	});
	
	socket.on(optCodes['percentile'], function(data) {
		document.querySelector('#deadMessage').innerHTML ='You are in the ' + Math.round(data*100)/100 + '% Pecentile'; 
	});
	
	
	function error(){
		document.querySelector('#error').style.display = 'block';
		document.querySelector('#join').style.display = 'none';
		document.querySelector('#pos').style.display = 'block';
		fail = true;
	}
	
	socket.ws.onerror = error;
	socket.ws.onclose = error;
	
	window.onresize = function() {
		socket.emit(optCodes['land'],{
			w: innerWidth / render.zoom,
			h: innerHeight / render.zoom
		});
	};
	
	document.querySelector('#canvas').onclick = function(data){
		document.querySelector('#deadMenu').style.display='none';
		
		var player = gameMain.game.state.globs[gameMain.game.uuid];
		if (!player) {//is playing
			return;
		}
		
		// Consider where the player is positioned.
		var px = (player.x - render.mapCord.x) * render.zoom;
		var py = (player.y - render.mapCord.y) * render.zoom;
		// Get the angle of the shot
		var angle = Math.atan2(data.offsetY - py, data.offsetX - px);
		socket.emit(optCodes['shoot'], { direction: angle });
	};
	
	var lx = 0;
	var ly = 0;
	
	document.querySelector('#canvas').onmousedown = function(){
		if (gameMain.game.state.globs[gameMain.game.uuid] || fail) {
			return;
		}
		document.querySelector('#canvas').style.cursor = 'move';
	};
	
	document.querySelector('#canvas').onmouseup = function(){
		if (gameMain.game.state.globs[gameMain.game.uud] || fail) {
			return;
		}
		document.querySelector('#canvas').style.cursor = 'default';
	};
	
	document.querySelector('#canvas').onmousemove = function(data){
		if (gameMain.game.state.globs[gameMain.game.uud] || fail) {
			return;
		}
		var mx = data.offsetX / render.zoom;
		var my = data.offsetY / render.zoom;
		if(data.buttons==1){
			render.mapCord.x += lx - mx;
			render.mapCord.y += ly - my;
			socket.emit(optCodes['cam'],{
				x: Math.round(render.canvas.width / 2 / render.zoom + render.mapCord.x),
				y: Math.round(render.canvas.height / 2 / render.zoom + render.mapCord.y)
			});
		
		}
		
		render.camFit();
		
		lx = mx;
		ly = my;
	};
	
	//chatroom
	document.querySelector('#chatToggle').onclick = function(){
		if(this.value == 'Show Chat'){
			this.value = 'Hide Chat';
			document.querySelector('#chatroom').style.display = 'block';
		}else{
			this.value = 'Show Chat';
			document.querySelector('#chatroom').style.display = 'none';
		}
	};
	
	function sendChat(){
		if(document.querySelector('#chatInput').value == '')return ;
		socket.emit(optCodes['chat'],document.querySelector('#chatInput').value);
		document.querySelector('#chatInput').value = '';
		document.querySelector('#chatInput').disabled = true;
		document.querySelector('#chatSend').innerHTML = 'CANCEL';
	}
	
	document.querySelector('#chatInput').onkeypress = function(e){
		if (e.keyCode != 13)return;
		sendChat();
	};
	
	document.querySelector('#chatSend').onclick = function(){
		if(this.innerHTML == 'SEND'){
			sendChat();
			return ;
		}
		socket.emit(optCodes['chatC']);
	};
	
	socket.on(optCodes['chat'], function(data) {
		var msg = document.createElement('div');

		var nick = document.createElement('span');
		nick.innerHTML = utils.text2html((data.n || 'NO NAME') + ': ');
		nick.style.color = 'rgb('+data.c[0]+','+data.c[1]+','+data.c[2]+')';
		msg.appendChild(nick);
		
		var text = document.createElement('span');
		text.innerHTML = utils.text2html(data.t);
		msg.appendChild(text);
		
		var chatLogs = document.querySelector('#chatLogs');
		chatLogs.appendChild(msg);
		
		chatLogs.scrollTop = chatLogs.scrollHeight;
	});
	
	socket.on(optCodes['chatE'], function(data) {
		document.querySelector('#chatInput').disabled = !data;
		if(data)document.querySelector('#chatInput').value = '';
		document.querySelector('#chatSend').innerHTML = data ?  'SEND' : 'CANCEL';
	});
	
	socket.on(optCodes['chatQ'], function(data) {
		document.querySelector('#chatInput').value = 'YOU ARE '+ data[0] + ' OUT OF ' + data[1];
	});
}


module.exports = {
	start: start
};
