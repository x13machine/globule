import config from '../config';
import gameMain from './game';
import stats from './stats';
import network from './network';
import sectorTick from './sectors';

setInterval(function(){
	let sockets = gameMain.game.sockets;
	gameMain.game.update();
	let globs = gameMain.game.state.globs;
	
	//process collisions

	let cols = gameMain.game.globIntersectList(globs);
	for(let i in cols){
		let cos = cols[i];
		
		if(!(cos[0].uuid in globs) || !(cos[1].uuid in globs) || !cos[0].transferAreas(cos[1]))continue;
		network.sendRemap(cos[0]);
		
		if(cos[0].uuid !== cos[1].lastContactID){
			cos[1].rating = cos[1].r / 2;
			cos[1].lastContactID = cos[0].uuid;
		}
		
		if(cos[1].r<gameMain.game.settings.minRadius){
			stats.updateRating(cos[0].uuid,cos[1].uuid);
			gameMain.game.leave(cos[1]);
			continue;
		}
		network.sendRemap(cos[1]);
	}

	let mass = 0;
	let masses = [];
	for(let i in globs){
		let glob = globs[i];
		
		//kill glob that below minium radius
		if(glob.r<gameMain.game.settings.minRadius){
			gameMain.game.leave(glob);
			continue;
		}
		
		//delete old sectors
		for(let z in glob.callings){
			delete gameMain.game.blockCall[glob.callings[z]][glob.uuid];
		}
		
		glob.callings = [];
		
		//figure what sectors the glob is in.
		let cells = glob.toCells(config.game.blockSize);
		for(let z in cells){
			let cell = cells[z];
			let cord = cell.x+'_'+cell.y;
			glob.callings.push(cord);
			gameMain.game.blockCall[cord] = gameMain.game.blockCall[cord] || {};
			gameMain.game.blockCall[cord][glob.uuid] = glob;
		}
		
		//add mass to total
		let mc = glob.r.toArea();
		mass+=mc;
		masses.push(mc);
	}
	
	
	//add new globs
	for(;gameMain.game.settings.maxGlobs > Object.keys(globs).length && gameMain.game.settings.maxMass > mass;){
		let glob = gameMain.game.append('glob');
		network.sendJoin(glob,{
			append: true
		});
		mass+=glob.r.toArea();
	}
	
	sectorTick();
	
	for(let i in sockets){
		sockets[i].emit();
	}
},1000/config.game.tps);
