import config from '../config';
import Glob from './glob';
import network from './network';
import sharedGame from '../shared/game';
import utils from './utils';

class Game extends sharedGame {
	sockets = {};

	shoot(playerUUID, direction) {
		let player = this.state.globs[playerUUID];
		
		let vx = Math.cos(direction);
		let vy = Math.sin(direction);
		
		let playerArea = player.r.toArea();
		
		player.r=(playerArea*(1-this.settings.shootSizeRadio)).toRadius();
		
		player.vx-=vx*this.settings.shootSpeed;
		player.vy-=vy*this.settings.shootSpeed;
		
		let speed = Math.sqrt(Math.pow(player.vx,2)+Math.pow(player.vy,2));
		if(this.settings.maxSpeed <= speed){
			let ratio = this.settings.maxSpeed / speed;
			player.vx *= ratio;
			player.vy *= ratio;
		}
		
		let globRadius=(playerArea*this.settings.shootSizeRadio).toRadius();
		
		let glob = new Glob({
			uuid: utils.uuid(),
			vx: vx*this.settings.globShootSpeed,
			vy: vy*this.settings.globShootSpeed,
			x: player.x + (player.r + globRadius) * vx,
			y: player.y + (player.r + globRadius) * vy,
			r: globRadius,
			color: 0
		});
		
		this.state.globs[glob.uuid] = glob;
		network.sendShoot(player);
		network.sendJoin(glob);
		
		for(let i in this.sockets){
			this.sockets[i].lastVisible.push(glob.uuid);
		}
	}
	
	append(type,client) {
		client = client || {};
		// Add the glob to the world
		let angle=0,distance=0;
		
		if(type=='glob'){
			angle = Math.TAU*Math.random();
			distance = Math.random() * this.settings.globSpeed;
		}
		
		let glob = new Glob({
			type:type,
			color: client.color || 0,
			uuid: client.uuid || utils.uuid(),
			name: client.name,
			x: Math.random()*this.settings.width,
			y: Math.random()*this.settings.height,
			vx: distance*Math.cos(angle),
			vy: distance*Math.sin(angle),
			r: type === 'glob' ? this.settings.globSize : this.settings.playerSize,
			rating:0,
			lastContactID:''
		});
		
		for(let i=0;i<10;i++){
			if(!glob.intersectTest())break;
			glob.x = Math.random()*this.settings.width;
			glob.y = Math.random()*this.settings.height;
		}
		let cells = glob.toCells(config.colSize);
		for(let z in cells){
			let cell = cells[z].x+'_'+cells[z].y;
			this.sectors[cell] = this.sectors[cell] || [];
			this.sectors[cell].push(glob);
		}
		
		this.state.globs[glob.uuid] = glob;
		return glob;
	}

	globIntersectList (globs){
		this.sectors = {};
		for(let i in globs){
			let cells = globs[i].toCells(config.game.colSize);
			for(let z in cells){
				let cell = cells[z].x+'_'+cells[z].y;
				this.sectors[cell] = this.sectors[cell] || [];
				this.sectors[cell].push(globs[i]);
			}
		}
		
		let cols={};
		for(let i in this.sectors){
			let sec = this.sectors[i];
			for(let z in sec){
				let glob1 = sec[z];
				for(let j in sec){
					let glob2 = sec[j];
					if(glob1 === glob2)continue;
					if(!glob1.intersects(glob2))continue;
					
					cols[glob1.uuid < glob2.uuid? glob1.uuid + '_' + glob2.uuid : glob2.uuid + '_' + glob1.uuid]=true;
				}
			}
		}		
		
		let cas = [];
		
		for(let i in cols){
			let glo = i.split('_');
			
			if(globs[glo[0]].r > globs[glo[1]].r){
				cas.push([globs[glo[0]],globs[glo[1]]]);
			}else{
				cas.push([globs[glo[1]],globs[glo[0]]]);
			}
		}
		return cas;
	}

	constructor(settings){
		super(settings, Glob);
	}
}

export default {
	Game: Game,
	game: new Game()
};