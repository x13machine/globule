import Glob from './glob';

class Game {	
	state = {
		globs:{}
	};
	
	blockCall = {};
	sectors = {};
	listeners = {};
	totalGlobMass = 0;
	totalPlayerMass = 0;
	
	lastFrame=new Date().getTime();

	join (data) {
		// Add the player to the world
		let glob = new this.Glob(data);
		this.state.globs[data.uuid] = glob;
		return glob;
	}

	update() {	
		let now = new Date().getTime();
		let delta = (now - this.lastFrame)/1000;
		let globs = this.state.globs;
		for (let i in globs) {
			globs[i].update(delta, this.settings);
		}
		
		this.lastFrame=now;
		return delta;
	}

	leave(glob) {
		if(glob === undefined)return ;
		if(typeof global === 'object'){
			for(let i in glob.callings){
				delete this.blockCall[glob.callings[i]][glob.uuid];
			}
	
			let cells = glob.toCells(this.settings.colSize);
			for(let i in cells){
				let sector = this.sectors[cells[i].x+'_'+cells[i].y];
				if(sector){
					let z = sector.indexOf(glob.uuid);
					if(z>-1)sector.slice(i,1);
				}
			}
			
		}

		delete this.state.globs[glob.uuid];
	}
	
	constructor(settings, Glob2){
		this.settings = settings || {
			width:0,
			height:0
		};

		this.Glob = Glob2 || Glob;
		this.settings.globShootSpeed = this.settings.shootSpeed / this.settings.shootSizeRadio;
		this.settings.maxMass = this.settings.width*this.settings.height*this.settings.maxMassPercent;
	}
}

export default Game;