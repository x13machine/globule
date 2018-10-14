//game logic
var Game = function(settings) {
	this.settings = settings || {
		width:0,
		height:0
	}
	
	this.settings.globShootSpeed = this.settings.shootSpeed/this.settings.shootSizeRadio;
	this.settings.maxMass = this.settings.width*this.settings.height*this.settings.maxMassPercent;
	this.state = {
		globs:{}
	}
	
	this.sockets = {};
	this.blockCall = {};
	this.listeners = {};
	this.totalGlobMass = 0;
	this.totalPlayerMass = 0;
	
	this.lastFrame=new Date().getTime();
}

Game.prototype.update = function() {
	
	var now = new Date().getTime();
	var delta = (now - this.lastFrame)/1000;
	var globs = this.state.globs;
	for (var i in globs) {
		var data = globs[i].update(delta,this.settings);
	}
	
	this.lastFrame=now;
	return delta;
}

Game.prototype.join = function(data) {
	// Add the player to the world
	var glob = new Glob(data)
	this.state.globs[data.uuid] = glob;
	return glob;
}

Game.prototype.leave = function(glob) {
	if(glob == undefined)return ;
	if(typeof global == 'object'){
		for(var i in glob.callings){
			delete this.blockCall[glob.callings[i]][glob.uuid];
		}
		
		var cells = glob.toCells(game.settings.colSize);
		for(var i in cells){
			var sector = sectors[cells[i].x+'_'+cells[i].y];
			if(sector){
				var z = sector.indexOf(glob.uuid)
				if(z>-1)sector.slice(i,1);
			}
		}
		
		//deadMan(glob);
	}
	delete this.state.globs[glob.uuid];
	
}

if(typeof global == "object")global.Game = Game;
