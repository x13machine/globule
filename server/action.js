Game.prototype.shoot = function(playerUUID, direction) {
	var player = this.state.globs[playerUUID];
	
	var vx = Math.cos(direction);
	var vy = Math.sin(direction);
	
	var playerArea = player.r.toArea();
	
	player.r=(playerArea*(1-this.settings.shootSizeRadio)).toRadius();
	
	player.vx-=vx*this.settings.shootSpeed;
	player.vy-=vy*this.settings.shootSpeed;
	
	var speed = Math.sqrt(Math.pow(player.vx,2)+Math.pow(player.vy,2));
	if(game.settings.maxSpeed <= speed){
		var ratio = game.settings.maxSpeed / speed;
		player.vx *= ratio;
		player.vy *= ratio;
	}
	
	var globRadius=(playerArea*this.settings.shootSizeRadio).toRadius();
	
	var glob = new Glob({
		uuid: uuid(),
		vx: vx*this.settings.globShootSpeed,
		vy: vy*this.settings.globShootSpeed,
		x: player.x + (player.r + globRadius) * vx,
		y: player.y + (player.r + globRadius) * vy,
		r: globRadius,
		color: [255,0,0]
	});
	
	this.state.globs[glob.uuid] = glob;
	sendShoot(player);
	sendJoin(glob);
	
	for(var i in game.sockets){
		game.sockets[i].lastVisible.push(glob.uuid)
	}
}



Game.prototype.append = function(type,client) {
	var client = client || {};
	// Add the glob to the world
	var angle=0,distance=0;
	
	if(type=='glob'){
		angle = Math.TAU*Math.random();
		distance = Math.random() * this.settings.globSpeed;
	}
	
	var glob = new Glob({
		type:type,
		color: client.color || [255,0,0],
		uuid: client.uuid || uuid(),
		name: client.name,
		x: Math.random()*this.settings.width,
		y: Math.random()*this.settings.height,
		vx: distance*Math.cos(angle),
		vy: distance*Math.sin(angle),
		r: type == 'glob' ? this.settings.globSize : this.settings.playerSize,
		rating:0,
		lastContactID:''
	});
	
	for(var i=0;i<10;i++){
		if(!glob.intersectTest())break;
		glob.x = Math.random()*this.settings.width;
		glob.y = Math.random()*this.settings.height;
	}
	var cells = glob.toCells(config.game.colSize);
	for(var z in cells){
		var cell = cells[z].x+'_'+cells[z].y;
		sectors[cell] = sectors[cell] || [];
		sectors[cell].push(glob);
	}
	
	this.state.globs[glob.uuid] = glob;
	return glob;
}
