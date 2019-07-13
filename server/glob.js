import sharedGlob from '../shared/glob';
import collision from './collision';
import config from '../config';
import {game} from './game';

class Glob extends sharedGlob {
	transferArea(area) {
		this.r = (this.r.toArea()+area).toRadius();
	}
	
	areaTake(other) {
		var R = this.r;
		var r = other.r;
		var d = this.distance(other);
		
		//if smaller circle is inside
		if(R>=d+r)return r*r*Math.PI;
		if(d>=R+r)return NaN;
		
		//if they just intersect
		var rs=r*r,Rs=R*R,ds=d*d,dd=2*d;
		var part1 = rs*Math.acos((ds + rs - Rs)/(dd*r));
		var part2 = Rs*Math.acos((ds + Rs - rs)/(dd*R));
		var part3 = Math.sqrt((-d+r+R)*(d+r-R)*(d-r+R)*(d+r+R))/2;
		return part1 + part2 - part3;
	}
	
	transferAreas(p) {
		var big = this;
		var small = p;
		
		if (big.r < small.r) {
			big = p;
			small = this;
		}
		
		var diff = big.areaTake(small);
		if(isNaN(diff))return false;
		small.transferArea(-diff);
		big.transferArea(diff);
		return true;
	}
	
	toCells(size){
		var s = this.r * 2;
		return collision.rect2cells({
			x: this.x - this.r,
			y: this.y - this.r,
			w: s,
			h: s
		},size);
	}

	intersectTest(){
		var cells = this.toCells(config.game.colSize);
		for(var i in cells){
			var sector = game.sectors[cells[i].x+'_'+cells[i].y];
			for(var z in game.sectors){
				if(this.intersects(sector[z]))return true;
			}
		}
		return false;
	}
	
	constructor(params){
		super(params);
	}
}


export default Glob;