function start(){
	$('#play').onclick = undefined;
	$('#spectate').onclick = undefined;
	$('#connecting').style.display = 'block';
	var id = this.id;
	begin(id);
}


function begin(mode){
	var name=$('#nick').value;
	var colour = $('#color').value;
	sessionStorage.nick=name;
	sessionStorage.color=colour;
	$('#game').style.display = 'block';
	$('#home').style.display = 'none';
	$('#canvas').style.display = 'block';
	var socket = connect();
	var fail = false;
	var game = new Game();
	window.rating = null;
	game.socket = socket;

	window.uuid = null;
	
	window.render = new CanvasRenderer(game);
	// Start the renderer.
	render.render();
	
	var color = hexToRgb(colour);
	
	socket.ws.onopen = function(){
		socket.emit(optCodes['login'],{
			name:name,
			w: innerWidth,
			h: innerHeight,
			r: color.r,
			g: color.g,
			b: color.b,
		});
	}
	
	$('#deadClose').onclick = function(){
		$('#deadMenu').style.display='none';
	}
	
	// Get the initial game state
	socket.on(optCodes['start'], function(data) {
		$('#chatToggle').style.display = 'inline-block';
		$('#join').style.display = 'inline-block';
		function join(){
			socket.emit(optCodes['join']);
		}
		
		$('#join').onclick = join;
		$('#respawn').onclick = join;
		
		//clone data
		uuid = data.uuid;
		name = data.name;
		game = new Game(data.settings);
		render.game = game;
		game.socket = socket;
		render.started = true;
		
		if (mode != "spectate") {
			socket.emit(optCodes['join']);
			$('#join').style.display = 'none';
		}
		
	});
	
	// A new client joins.
	socket.on(optCodes['join'], function(data) {
		if(data.u == uuid){
			$('#join').style.display = 'none';
			$('#deadMenu').style.display = 'none';
			render.zoom = 1;
			$('#canvas').style.cursor = 'default';
		}
		
		data.vx = data.X;
		data.vy = data.Y;
		data.type = data.t;
		data.color = data.c;
		data.uuid = data.u;
		game.join(data);
	});
	
	socket.on(optCodes['remap'], function(data) {
		try{
			game.state.globs[data.u].x = data.x;
			game.state.globs[data.u].y = data.y;
			game.state.globs[data.u].r = data.r;
		}catch(err){
			//console.log('remap',err,data)
		}
	});
	
	socket.on(optCodes['shoot'], function(data) {
		game.state.globs[data.u].r = data.r;
		game.state.globs[data.u].x = data.x;
		game.state.globs[data.u].y = data.y;
		game.state.globs[data.u].vx = data.X;
		game.state.globs[data.u].vy = data.Y;
	});
	
	socket.on(optCodes['rating'],function(data){
		rating = data;
	});
	
	socket.on(optCodes['players'],function(data){
		render.players = data;
	});
	
	socket.on(optCodes['rank'],function(data){
		render.rank = data;
	});
	
	socket.on(optCodes['closeMsg'],function(data){
		$('#closeMsg').innerHTML = text2html(data);
	});
	
	socket.on(optCodes['leaderboard'],function(data){
		var html='';
		for(var i in data){
			html+= (~~i+1) +') ';
			html+= text2html(data[i][0] || "NO NAME");
			html+= ' - ' + Math.round(data[i][1]) + '<br>'
		}
		
		$('#leaderboard').innerHTML = html;
	});
	
	socket.on(optCodes['state'],function(){
		game.state.globs = {};
	});
	
	// A client leaves.
	socket.on(optCodes['leave'], function(data) {
		game.leave(game.state.globs[data]);
		if(data == uuid){
			var score = Math.round(rating);
			$('#join').style.display = 'inline-block';
			$('#deadMenu').style.display = 'block';
			$('#deadScore').innerHTML = 'Score: '+ score;
			$('#deadMessage').innerHTML = '';
			render.players--;
			rating = null;
		}
	});
	
	socket.on(optCodes['percentile'], function(data) {
		$('#deadMessage').innerHTML ='You are in the ' + Math.round(data*100)/100 + '% Pecentile' 
	});
	
	
	function error(){
		$('#error').style.display = 'block';
		$('#join').style.display = 'none';
		$('#pos').style.display = 'block';
		fail = true;
	}
	
	socket.ws.onerror = error;
	socket.ws.onclose = error;
	
	window.onresize = function() {
		socket.emit(optCodes['land'],{
			w: innerWidth / render.zoom,
			h: innerHeight / render.zoom
		});
	}
	
	/*
	$('#canvas').onmousewheel = function(data){
		var change = data.wheelDelta/120;
		
		var rx = data.offsetX / render.zoom - render.mapCord.x;
		var ry = data.offsetY / render.zoom - render.mapCord.y;
		render.zoom = Math.min(render.zoom * Math.pow(1.06,change),1);
		var cx = data.offsetX / render.zoom - render.mapCord.x;
		var cy = data.offsetY / render.zoom - render.mapCord.y;
		
		render.mapCord.x+= rx - cx;
		render.mapCord.y+= ry - cy;
		
		socket.emit(optCodes['land'],{
			w: innerWidth / render.zoom,
			h: innerHeight / render.zoom
		});
	}*/
	
	$('#canvas').onclick = function(data){
		$('#deadMenu').style.display='none';
		
		var player = game.state.globs[uuid];
		if (!player) {//is playing
			return;
		}
		
		// Consider where the player is positioned.
		var px = (player.x - render.mapCord.x) * render.zoom;
		var py = (player.y - render.mapCord.y) * render.zoom;
		// Get the angle of the shot
		var angle = Math.atan2(data.offsetY - py, data.offsetX - px);
		socket.emit(optCodes['shoot'], { direction: angle });
	}
	
	var lx = 0;
	var ly = 0;
	
	$('#canvas').onmousedown = function(){
		if (game.state.globs[uuid] || fail) {
			return;
		}
		$('#canvas').style.cursor = 'move';
	}
	
	$('#canvas').onmouseup = function(){
		if (game.state.globs[uuid] || fail) {
			return;
		}
		$('#canvas').style.cursor = 'default';
	}
	
	$('#canvas').onmousemove = function(data){
		if (game.state.globs[uuid] || fail) {
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
	}
	
	//chatroom
	$('#chatToggle').onclick = function(){
		if(this.value == 'Show Chat'){
			this.value = 'Hide Chat';
			$('#chatroom').style.display = 'block';
		}else{
			this.value = 'Show Chat';
			$('#chatroom').style.display = 'none';
		}
	}
	
	function sendChat(){
		if($('#chatInput').value == '')return ;
		socket.emit(optCodes['chat'],$('#chatInput').value);
		$('#chatInput').value = '';
		$('#chatInput').disabled = true;
		$('#chatSend').innerHTML = 'CANCEL';
	}
	
	$('#chatInput').onkeypress = function(e){
		if (e.keyCode != 13)return;
		sendChat();
	}
	
	$('#chatSend').onclick = function(){
		if(this.innerHTML == 'SEND'){
			sendChat();
			return ;
		}
		socket.emit(optCodes['chatC']);
	}
	
	socket.on(optCodes['chat'], function(data) {
		var msg = document.createElement('div');

		var nick = document.createElement('span');
		nick.innerHTML = text2html((data.n || 'NO NAME') + ': ');
		nick.style.color = 'rgb('+data.c[0]+','+data.c[1]+','+data.c[2]+')';
		msg.appendChild(nick);
		
		var text = document.createElement('span');
		text.innerHTML = text2html(data.t);
		msg.appendChild(text);
		
		var chatLogs = $('#chatLogs');
		chatLogs.appendChild(msg);
		
		chatLogs.scrollTop = chatLogs.scrollHeight;
	});
	
	socket.on(optCodes['chatE'], function(data) {
		$('#chatInput').disabled = !data;
		if(data)$('#chatInput').value = '';
		$('#chatSend').innerHTML = data ?  'SEND' : 'CANCEL';
	});
	
	socket.on(optCodes['chatQ'], function(data) {
		$('#chatInput').value = 'YOU ARE '+ data[0] + ' OUT OF ' + data[1];
	});
}
