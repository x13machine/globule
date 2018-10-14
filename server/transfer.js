Glob.prototype.transferArea = function(area) {
	this.r = (this.r.toArea()+area).toRadius();
}

Glob.prototype.areaTake = function(other) {
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

Glob.prototype.transferAreas = function(p) {
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
