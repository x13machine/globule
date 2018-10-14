var CanvasRenderer = function(game) {
	this.mapCord = {
		x:0,
		y:0
	}
	
	this.backgroundSize = {
		width: 32,
		height: 32
	}
	
	this.started = false;
	this.lastCamUpdate = 0;
	this.rank = 1;
	this.players = 1;
	this.zoom = 1;
	this.game = game;
	this.canvas = $('#canvas');
	this.context = this.canvas.getContext('2d');
}

CanvasRenderer.prototype.globOnScreen=function(glob){
	//check if glob is on the screen
	var halfWidth = this.canvas.width / 2;
	var halfHeight = this.canvas.height / 2;
	var radius = glob.r * this.zoom + 5;
	var gx = (glob.x-this.mapCord.x) * this.zoom;
	var gy = (glob.y-this.mapCord.y) * this.zoom;
	
	var cdx = Math.abs(gx - halfWidth);
	
	var cdy = Math.abs(gy - halfHeight);
	var halfPlusRaduisWidth = halfWidth + radius;
	
	if (cdx > halfWidth + radius || cdy > halfHeight + radius) return false;
	
	if (cdx <= halfWidth || cdy <= halfHeight) return true;
	
	return Math.pow(cdx - halfWidth,2) + Math.pow(cdy - halfHeight,2) <= Math.pow(radius,2);
}

CanvasRenderer.prototype.mapCordUpdate=function(){
	//follow player glob
	var player = this.game.state.globs[uuid];

	if(!player)return;
	var rx = player.x - this.mapCord.x;
	var ry = player.y - this.mapCord.y;
	
	if(0 > rx || rx > this.canvas.width || 0 > ry || ry > this.canvas.height){
		this.mapCord.x = player.x - this.canvas.width/2;
		this.mapCord.y = player.y - this.canvas.height/2;
		return ;
	}
	
	var px = this.canvas.width/3;
	var py = this.canvas.height/3
	
	var changed = false;
	if(rx<px){
		this.mapCord.x-=px-rx;
		changed = true;
	}else if(this.canvas.width-px<rx){
		this.mapCord.x+=rx-(this.canvas.width-px);
		changed = true;
	}
	
	if(ry<py){
		this.mapCord.y-=py-ry;
		changed = true;
	}else if(this.canvas.height-py<ry){
		this.mapCord.y+=ry-(this.canvas.height-py);
		changed = true;
	}
	
	if(changed && new Date().getTime() - this.lastCamUpdate > this.game.settings.maxCamUpdate * 1000){
		this.game.socket.emit(optCodes['cam'],{
			x: Math.round(this.canvas.width / 2 / this.zoom + this.mapCord.x),
			y: Math.round(this.canvas.height / 2 / this.zoom + this.mapCord.y)
		});
		this.lastCamUpdate = new Date().getTime();
	}
}

CanvasRenderer.prototype.camFit=function(){
	//fixes camera postion and zoom
	
	this.mapCord.x = Math.max(0,Math.min(this.mapCord.x,this.game.settings.width-this.canvas.width/this.zoom));
	this.mapCord.y = Math.max(0,Math.min(this.mapCord.y,this.game.settings.height-this.canvas.height/this.zoom));
	if(this.canvas.width>this.game.settings.width*this.zoom){
		this.zoom = this.canvas.width / this.game.settings.width;
	}
	if(this.canvas.height>this.game.settings.height*this.zoom){
		this.zoom = this.canvas.height / this.game.settings.height;
	}
	
	if(!Number.isFinite(this.zoom))this.zoom = 1;
}

CanvasRenderer.prototype.render = function() {
	var ctx = this;
	
	requestAnimFrame(function() {
		ctx.render.call(ctx);
	});
	
	if(!this.started)return ;
	
	
	//compute game state
	this.canvas.width = innerWidth;
	this.canvas.height = innerHeight;
	var delta=this.game.update();

	if(delta>this.game.settings.maxDelta){
		this.game.socket.emit(optCodes['state']);
	}
	
	var player = this.game.state.globs[uuid];
	
	//compute camera
	this.mapCordUpdate();
	this.camFit();
	
	//display stats
	var html = '';
	
	html += 'Position: ';
	html += Math.round(this.mapCord.x);
	html += ', ';
	html += Math.round(this.mapCord.y);
		html += '<br>';
		
	if(player){
		html += 'Mass: ';
		html += Math.round(player.r.toArea()/100)/10;
		html += '<br>';
	}
	
	if(rating){
		html += 'Score: ';
		html += Math.round(rating);
		html += '<br>';
	}
	
	if(this.game.state.globs[uuid]){
		html += 'Rank: ';
		html += Math.round(this.rank) +' / '+ Math.round(this.players);
	}else{
		html += 'Players: ';
		html += Math.round(this.players);	
	}
	$('#info').innerHTML = html;	
	//display background
	canvas.style.backgroundPosition = -this.mapCord.x*this.zoom+'px '+-this.mapCord.y*this.zoom+'px';
	canvas.style.backgroundSize = this.backgroundSize.width*this.zoom+'px '+this.backgroundSize.height*this.zoom+'px';
	
	
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	var globs = this.game.state.globs;
	
	//sort globs to smallest to biggest
	var keys=Object.keys(globs);
	
	keys.sort(function (a, b) {
		return globs[a].r - globs[b].r;
	});
	
	// Render the game state
	for (var i in keys) {
		this.renderGlob(globs[keys[i]]);
	}
	
}

CanvasRenderer.prototype.renderGlob = function(glob) {
	
	if(!this.globOnScreen(glob))return;
	
	//compute rendering data
	var border=3;
	
	var ctx = this.context;
	var c = glob.color;
	
	var renderCord = {
		x: (glob.x-this.mapCord.x) * this.zoom,
		y: (glob.y-this.mapCord.y) * this.zoom
	}
	
	var sr = glob.r * this.zoom;
	var sr2 = (glob.r - border) * this.zoom;
	try{
		//html5 canvas nonsense
		ctx.shadowBlur = 0;
		ctx.beginPath();
		ctx.arc(renderCord.x, renderCord.y, sr2, 0, Math.TAU, false);
		ctx.fillStyle = '#000';
		ctx.fill();
		
		var gradient = ctx.createRadialGradient(renderCord.x, renderCord.y, 0, renderCord.x, renderCord.y, sr);
		gradient.addColorStop(0, 'rgba(0,0,0,0.0)');
		gradient.addColorStop(1, 'rgba('+~~c[0]+','+~~c[1]+','+~~c[2]+',0.5)');
		
		ctx.beginPath();
		ctx.arc(renderCord.x, renderCord.y, sr2, 0, Math.TAU, false);
		ctx.fillStyle = gradient;
		ctx.fill();
		ctx.lineWidth = border;
		ctx.shadowColor = 'rgb('+~~c[0]+','+~~c[1]+','+~~c[2]+')';
		ctx.shadowBlur = 10;
		ctx.strokeStyle = 'rgb('+~~(c[0]/2)+','+~~(c[1]/2)+','+~~(c[2]/2)+')';
		ctx.stroke();
		if (glob.type != 'player') return;
		var color = glob.uuid == uuid ? '#777' : '#FFF';
		ctx.font = glob.r / 3 +"px Fjalla One";
		ctx.fillStyle = color;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.shadowColor = color;
		ctx.fillText(glob.name || (glob.uuid == uuid ? 'YOU' : 'NO NAME'), renderCord.x, renderCord.y);
	}catch(err){}
}
