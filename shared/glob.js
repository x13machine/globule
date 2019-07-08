Math.TAU = Math.PI * 2;
Number.prototype.toRadius=function(){
	return Math.sqrt(Math.max(0,this) / Math.PI);
};

Number.prototype.toArea=function(){
	return Math.pow(this,2) * Math.PI;
};

class Glob {
	type = 'glob';
	prevBlocks = [];
	intersects(other) {
		return this.distance(other) < other.r + this.r;
	}
	
	distance(other) {
		return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));
	}
	
	update(delta, settings) {
	
		var mass = this.r.toArea();
		this.x += this.vx * delta;
		this.y += this.vy * delta;
		this.r = (mass * Math.pow(0.5, delta / ( (this.type == 'glob' ? settings.globHalfLife : settings.playerHalfLife)  / mass))).toRadius();
		
		if(settings.width<this.x + this.r){
			this.x = settings.width - this.r;
			this.vx*= -1;
		}else if(this.x - this.r < 0){
			this.x = this.r;
			this.vx*= -1;
		}
		
		if(settings.height < this.y + this.r){
			this.y = settings.height - this.r;
			this.vy*=-1;
		}else if(this.y - this.r < 0 ){
			this.y = this.r;
			this.vy*= -1;
		}
	}
	constructor(params){
		for(let i in params){
			this[i] = params[i];
		}
	}
}

module.exports = Glob;