
import config from '../config';
import Glob from './glob';
import network from './network';
import {sharedGame} from '../shared/game';

class Game extends sharedGame {
	shoot(playerUUID, direction) {
		var player = this.state.globs[playerUUID];
		
		var vx = Math.cos(direction);
		var vy = Math.sin(direction);
		
		var playerArea = player.r.toArea();
		
		player.r=(playerArea*(1-this.settings.shootSizeRadio)).toRadius();
		
		player.vx-=vx*this.settings.shootSpeed;
		player.vy-=vy*this.settings.shootSpeed;
		
		var speed = Math.sqrt(Math.pow(player.vx,2)+Math.pow(player.vy,2));
		if(this.settings.maxSpeed <= speed){
			var ratio = this.settings.maxSpeed / speed;
			player.vx *= ratio;
			player.vy *= ratio;
		}
		
		var globRadius=(playerArea*this.settings.shootSizeRadio).toRadius();
		
		var glob = new Glob({
			uuid: utils.uuid(),
			vx: vx*this.settings.globShootSpeed,
			vy: vy*this.settings.globShootSpeed,
			x: player.x + (player.r + globRadius) * vx,
			y: player.y + (player.r + globRadius) * vy,
			r: globRadius,
			color: [255,0,0]
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
		var angle=0,distance=0;
		
		if(type=='glob'){
			angle = Math.TAU*Math.random();
			distance = Math.random() * this.settings.globSpeed;
		}
		
		var glob = new Glob({
			type:type,
			color: client.color || [255,0,0],
			uuid: client.uuid || utils.uuid(),
			name: client.name,
			x: Math.random()*this.settings.width,
			y: Math.random()*this.settings.height,
			vx: distance*Math.cos(angle),
			vy: distance*Math.sin(angle),
			r: type == 'glob' ? this.settings.globSize : this.settings.playerSize,
			rating:0,
			lastContactID:''
		});
		
		for(let i=0;i<10;i++){
			if(!glob.intersectTest())break;
			glob.x = Math.random()*this.settings.width;
			glob.y = Math.random()*this.settings.height;
		}
		var cells = glob.toCells(config.colSize);
		for(let z in cells){
			var cell = cells[z].x+'_'+cells[z].y;
			this.sectors[cell] = this.sectors[cell] || [];
			this.sectors[cell].push(glob);
		}
		
		this.state.globs[glob.uuid] = glob;
		return glob;
	}

	globIntersectList (globs){
		this.sectors = {};
		for(let i in globs){
			var cells = globs[i].toCells(config.colSize);
			for(let z in cells){
				var cell = cells[z].x+'_'+cells[z].y;
				this.sectors[cell] = this.sectors[cell] || [];
				this.sectors[cell].push(globs[i]);
			}
		}
		
		var cols={};
		for(let i in this.sectors){
			var sec = this.sectors[i];
			for(let z in sec){
				var glob1 = sec[z];
				for(let j in sec){
					var glob2 = sec[j];
					if(glob1 == glob2)continue;
					if(!glob1.intersects(glob2))continue;
					
					cols[glob1.uuid < glob2.uuid? glob1.uuid + '_' + glob2.uuid : glob2.uuid + '_' + glob1.uuid]=true;
				}
			}
		}
		
	
		var cas = [];
		
		for(let i in cols){
			var glo = i.split('_');
			
			if(globs[glo[0]].r > globs[glo[1]].r){
				cas.push([globs[glo[0]],globs[glo[1]]]);
			}else{
				cas.push([globs[glo[1]],globs[glo[0]]]);
			}
		}
		
		return cas;
	}
	constructor(settings){
		super(settings);
	}
}

export default {
	Game:Game,
	game: new Game()
};