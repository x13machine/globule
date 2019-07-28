import sharedGlob from '../shared/glob';
import config from '../config';
import gameMain from './game';

class Glob extends sharedGlob {
	transferArea(area) {
		this.r = (this.r.toArea()+area).toRadius();
	}
	
	areaTake(other) {
		let R = this.r;
		let r = other.r;
		let d = this.distance(other);
		
		//if smaller circle is inside
		if(R>=d+r)return r*r*Math.PI;
		if(d>=R+r)return NaN;
		
		//if they just intersect
		let rs=r*r,Rs=R*R,ds=d*d,dd=2*d;
		let part1 = rs*Math.acos((ds + rs - Rs)/(dd*r));
		let part2 = Rs*Math.acos((ds + Rs - rs)/(dd*R));
		let part3 = Math.sqrt((-d+r+R)*(d+r-R)*(d-r+R)*(d+r+R))/2;
		return part1 + part2 - part3;
	}
	
	transferAreas(p) {
		let big = this;
		let small = p;
		
		if (big.r < small.r) {
			big = p;
			small = this;
		}
		
		let diff = big.areaTake(small);
		if(isNaN(diff))return false;
		small.transferArea(-diff);
		big.transferArea(diff);
		return true;
	}

	intersectTest(){
		let cells = this.toCells(config.game.colSize);
		for(let i in cells){
			let sector = gameMain.game.sectors[cells[i].x+'_'+cells[i].y];
			for(let z in sector){
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