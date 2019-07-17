var Glob = require('./glob');
//game logic


class Game {	
	state = {
		globs:{}
	};
	sockets = {};
	sockets = {};
	blockCall = {};
	sectors = {};
	listeners = {};
	totalGlobMass = 0;
	totalPlayerMass = 0;
	
	lastFrame=new Date().getTime();

	join (data) {
		// Add the player to the world
		var glob = new Glob(data);
		this.state.globs[data.uuid] = glob;
		return glob;
	}

	update() {	
		var now = new Date().getTime();
		var delta = (now - this.lastFrame)/1000;
		var globs = this.state.globs;
		for (var i in globs) {
			globs[i].update(delta,this.settings);
		}
		
		this.lastFrame=now;
		return delta;
	}

	leave(glob) {
		if(glob == undefined)return ;
		if(typeof global == 'object'){
			for(let i in glob.callings){
				delete this.blockCall[glob.callings[i]][glob.uuid];
			}
			
			var cells = glob.toCells(this.settings.colSize);
			for(let i in cells){
				var sector = this.sectors[cells[i].x+'_'+cells[i].y];
				if(sector){
					var z = sector.indexOf(glob.uuid);
					if(z>-1)sector.slice(i,1);
				}
			}
			
		}

		delete this.state.globs[glob.uuid];
	}
	
	constructor(settings){
		this.settings = settings || {
			width:0,
			height:0
		};

		this.settings.globShootSpeed = this.settings.shootSpeed / this.settings.shootSizeRadio;
		this.settings.maxMass = this.settings.width*this.settings.height*this.settings.maxMassPercent;
	}
}

export default Game;