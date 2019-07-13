var config = require('../config');
var {game} = require('./game');
var stats = require('./stats');
var network = require('./network');
var sectorTick = require('./sectors');

setInterval(function(){
	var sockets = game.sockets;
	game.update();
	var globs = game.state.globs;
	
	//process collisions
	var cols = game.globIntersectList(globs);
	for(let i in cols){
		var cos = cols[i];
		
		if(!(cos[0].uuid in globs) || !(cos[1].uuid in globs) || !cos[0].transferAreas(cos[1]))continue;
		network.sendRemap(cos[0]);
		
		if(cos[0].uuid != cos[1].lastContactID){
			cos[1].rating = cos[1].r / 2;
			cos[1].lastContactID = cos[0].uuid;
		}
		
		if(cos[1].r<game.settings.minRadius){
			stats.updateRating(cos[0].uuid,cos[1].uuid);
			game.leave(cos[1]);
			continue;
		}
		network.sendRemap(cos[1]);
	}
	
	
	var mass = 0;
	var masses = [];
	for(let i in globs){
		var glob = globs[i];
		
		//kill glob that below minium radius
		if(glob.r<game.settings.minRadius){
			game.leave(glob);
			continue;
		}
		
		//delete old sectors
		for(let z in glob.callings){
			delete game.blockCall[glob.callings[z]][glob.uuid];
		}
		
		glob.callings = [];
		
		//figure what sectors the glob is in.
		var cells = glob.toCells(config.game.blockSize);
		for(let z in cells){
			var cell = cells[z];
			var cord = cell.x+'_'+cell.y;
			glob.callings.push(cord);
			game.blockCall[cord] = game.blockCall[cord] || {};
			game.blockCall[cord][glob.uuid] = glob;
		}
		
		//add mass to total
		var mc = glob.r.toArea();
		mass+=mc;
		masses.push(mc);
	}
	
	
	//add new globs
	for(;game.settings.maxGlobs > Object.keys(globs).length && game.settings.maxMass > mass;){
		let glob = game.append('glob');
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
