function cord2cell(cord,size){
	return {
		x:~~(cord.x/size),
		y:~~(cord.y/size)
	};
}

function rect2cells(rect,size){
	let topLeft=cord2cell({
		x: rect.x,
		y: rect.y
	},size);
	
	let bottomRight=cord2cell({
		x: rect.x + rect.w,
		y: rect.y + rect.h
	},size);
	
	let cells=[];
	
	for(let x=topLeft.x;x<=bottomRight.x;x++){
		for(let y=topLeft.y;y<=bottomRight.y;y++){
			cells.push({x:x, y:y});
		}
	}
	return cells;
}

function globIntersectCell(glob,cell,size){
	let half = size / 2;
	
	let cdx = Math.abs(glob.x - (cell.x * size + half));
		
	let cdy = Math.abs(glob.y - (cell.y * size + half));
	let halfPlusRadius = half + glob.r;
	
	if (cdx > halfPlusRadius || cdy > halfPlusRadius) return false;
	
	if (cdx <= half || cdy <= half) return true;
	
	return Math.pow(cdx - half,2) + Math.pow(cdy - half,2) <= Math.pow(glob.r,2);
}


module.exports ={
	cord2cell: cord2cell,
	rect2cells: rect2cells,
	globIntersectCell: globIntersectCell
};