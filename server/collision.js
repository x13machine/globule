global.cord2cell=function(cord,size){
	return {
		x:~~(cord.x/size),
		y:~~(cord.y/size)
	}
}

global.rect2cells=function(rect,size){
	var topLeft=cord2cell({
		x: rect.x,
		y: rect.y
	},size);
	
	var bottomRight=cord2cell({
		x: rect.x + rect.w,
		y: rect.y + rect.h
	},size);
	
	var cells=[];
	
	for(var x=topLeft.x;x<=bottomRight.x;x++){
		for(var y=topLeft.y;y<=bottomRight.y;y++){
			cells.push({x:x, y:y});
		}
	}
	
	return cells;
}

global.globIntersectCell=function(glob,cell,size){
	var half = size / 2;
	
	var cdx = Math.abs(glob.x - (cell.x * size + half));
		
	var cdy = Math.abs(glob.y - (cell.y * size + half));
	var halfPlusRaduis = half + glob.r;
	
	if (cdx > halfPlusRaduis || cdy > halfPlusRaduis) return false;
	
	if (cdx <= half || cdy <= half) return true;
	
	return Math.pow(cdx - half,2) + Math.pow(cdy - half,2) <= Math.pow(glob.r,2);
}

Glob.prototype.toCells=function(size){
	var s = this.r * 2;
	return rect2cells({
		x: this.x - this.r,
		y: this.y - this.r,
		w: s,
		h: s
	},size);
}

global.sectors = {}

global.globIntersectList=function(globs){
	sectors = {};
	for(var i in globs){
		var cells = globs[i].toCells(config.game.colSize);
		for(var z in cells){
			var cell = cells[z].x+'_'+cells[z].y;
			sectors[cell] = sectors[cell] || [];
			sectors[cell].push(globs[i]);
		}
	}
	
	var cols={}
	for(var i in sectors){
		var sec = sectors[i];
		for(var z in sec){
			var glob1 = sec[z];
			for(var j in sec){
				var glob2 = sec[j];
				if(glob1 == glob2)continue;
				if(!glob1.intersects(glob2))continue;
				
				cols[glob1.uuid < glob2.uuid? glob1.uuid + '_' + glob2.uuid : glob2.uuid + '_' + glob1.uuid]=true;
			}
		}
	}
	

	var cas = [];
	
	for(var i in cols){
		var glo = i.split('_');
		
		if(globs[glo[0]].r > globs[glo[1]].r){
			cas.push([globs[glo[0]],globs[glo[1]]]);
		}else{
			cas.push([globs[glo[1]],globs[glo[0]]]);
		}
	}
	
	return cas;
}

Glob.prototype.intersectTest = function(){
	var cells = this.toCells(config.game.colSize);
	for(var i in cells){
		var sector = sectors[cells[i].x+'_'+cells[i].y];
		for(var z in sector){
			if(this.intersects(sector[z]))return true;
		}
	}
	return false;
}
