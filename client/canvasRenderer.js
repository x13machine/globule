import utils from './utils';
import autoBind from 'auto-bind';

class CanvasRenderer{
	mapCord = {
		x:0,
		y:0
	};
	
	backgroundSize = {
		width: 32,
		height: 32
	};

	started = false;
	lastCamUpdate = 0;
	rank = 1;
	players = 1;
	zoom = 1;


	globOnScreen(glob){
		//check if glob is on the screen
		let halfWidth = this.canvas.width / 2;
		let halfHeight = this.canvas.height / 2;
		let radius = glob.r * this.zoom + 5;
		let gx = (glob.x-this.mapCord.x) * this.zoom;
		let gy = (glob.y-this.mapCord.y) * this.zoom;
		
		let cdx = Math.abs(gx - halfWidth);
		
		let cdy = Math.abs(gy - halfHeight);
		
		if (cdx > halfWidth + radius || cdy > halfHeight + radius) return false;
		
		if (cdx <= halfWidth || cdy <= halfHeight) return true;
		
		return Math.pow(cdx - halfWidth,2) + Math.pow(cdy - halfHeight,2) <= Math.pow(radius,2);
	}
	
	mapCordUpdate(){
		//follow player glob
		let player = this.game.state.globs[this.game.uuid];
	
		if(!player)return;
		let rx = player.x - this.mapCord.x;
		let ry = player.y - this.mapCord.y;
		
		if(0 > rx || rx > this.canvas.width || 0 > ry || ry > this.canvas.height){
			this.mapCord.x = player.x - this.canvas.width/2;
			this.mapCord.y = player.y - this.canvas.height/2;
			return ;
		}
		
		let px = this.canvas.width/3;
		let py = this.canvas.height/3;
		
		let changed = false;
		if(rx<px){
			this.mapCord.x-=px-rx;
			changed = true;
		}else if(this.canvas.width-px<rx){
			this.mapCord.x+=rx-(this.canvas.width-px);
			changed = true;
		}
		
		if(ry<py){
			this.mapCord.y-=py-ry;
			changed = true;
		}else if(this.canvas.height-py<ry){
			this.mapCord.y+=ry-(this.canvas.height-py);
			changed = true;
		}
		
		if(changed && new Date().getTime() - this.lastCamUpdate > this.game.settings.maxCamUpdate * 1000){
			this.socket.emit('cam',{
				x: Math.round(this.canvas.width / 2 / this.zoom + this.mapCord.x),
				y: Math.round(this.canvas.height / 2 / this.zoom + this.mapCord.y)
			});
			this.lastCamUpdate = new Date().getTime();
		}
	}
	
	camFit(){
		//fixes camera position and zoom
		
		this.mapCord.x = Math.max(0,Math.min(this.mapCord.x,this.game.settings.width-this.canvas.width/this.zoom));
		this.mapCord.y = Math.max(0,Math.min(this.mapCord.y,this.game.settings.height-this.canvas.height/this.zoom));
		if(this.canvas.width>this.game.settings.width*this.zoom){
			this.zoom = this.canvas.width / this.game.settings.width;
		}
		if(this.canvas.height>this.game.settings.height*this.zoom){
			this.zoom = this.canvas.height / this.game.settings.height;
		}
		
		if(!Number.isFinite(this.zoom))this.zoom = 1;
	}
	
	render() {
		utils.requestAnimFrame(() => this.render);
		
		
		//compute game state
		this.canvas.width = innerWidth;
		this.canvas.height = innerHeight;
		let delta=this.game.update();
	
		if(delta>this.game.settings.maxDelta){
			this.socket.emit('state');
		}
		
		let player = this.game.state.globs[this.game.uuid];
		
		//compute camera
		this.mapCordUpdate();
		this.camFit();
		
		//display stats
		let text = `Position: ${Math.round(this.mapCord.x)}, ${Math.round(this.mapCord.y)} \n`;
			
		if(player)text += 'Mass: ' + Math.round(player.r.toArea()/100)/10 + '\n';
		if(this.game.rating)text += `Score: ${Math.round(this.game.rating)}`;
		
		if(this.game.uuid in this.game.state.globs){
			text += `Rank: ${Math.round(this.rank)} / ${Math.round(this.players)}`;
		}else{
			text += `Players: ${Math.round(this.players)}`;
		}

		this.setInfo(text);
		//display background
		this.canvas.style.backgroundPosition = -this.mapCord.x*this.zoom+'px '+-this.mapCord.y*this.zoom+'px';
		this.canvas.style.backgroundSize = this.backgroundSize.width*this.zoom+'px '+this.backgroundSize.height*this.zoom+'px';
		
		
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		let globs = this.game.state.globs;
		
		//sort globs to smallest to biggest
		let keys=Object.keys(globs);
		
		keys.sort((a, b) => {
			return globs[a].r - globs[b].r;
		});
		
		// Render the game state
		for (let i in keys) {
			this.renderGlob(globs[keys[i]]);
		}
		
	}
	
	renderGlob(glob){
		
		if(!this.globOnScreen(glob))return;
		
		//compute rendering data
		let border=3;
		
		let ctx = this.context;
		let c = glob.color;
		
		let renderCord = {
			x: (glob.x-this.mapCord.x) * this.zoom,
			y: (glob.y-this.mapCord.y) * this.zoom
		};
		
		let sr = glob.r * this.zoom;
		let sr2 = (glob.r - border) * this.zoom;
		try{
			//html5 canvas nonsense
			ctx.shadowBlur = 0;
			ctx.beginPath();
			ctx.arc(renderCord.x, renderCord.y, sr2, 0, Math.TAU, false);
			ctx.fillStyle = '#000';
			ctx.fill();
			
			let gradient = ctx.createRadialGradient(renderCord.x, renderCord.y, 0, renderCord.x, renderCord.y, sr);
			gradient.addColorStop(0, 'rgba(0,0,0,0.0)');
			gradient.addColorStop(1, 'rgba('+~~c[0]+','+~~c[1]+','+~~c[2]+',0.5)');
			
			ctx.beginPath();
			ctx.arc(renderCord.x, renderCord.y, sr2, 0, Math.TAU, false);
			ctx.fillStyle = gradient;
			ctx.fill();
			ctx.lineWidth = border;
			ctx.shadowColor = 'rgb('+~~c[0]+','+~~c[1]+','+~~c[2]+')';
			ctx.shadowBlur = 10;
			ctx.strokeStyle = 'rgb('+~~(c[0]/2)+','+~~(c[1]/2)+','+~~(c[2]/2)+')';
			ctx.stroke();
			if (glob.type != 'player') return;
			let color = glob.uuid == this.game.rating ? '#777' : '#FFF';
			ctx.font = glob.r / 3 +'px Fjalla One';
			ctx.fillStyle = color;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.shadowColor = color;
			ctx.fillText(glob.name || (glob.uuid == this.game.uuid ? 'YOU' : 'NO NAME'), renderCord.x, renderCord.y);
		}catch(err){
			console.log(err);
		}
	}


	constructor(canvas, game, socket, setInfo) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
		this.game = game;
		this.socket = socket;
		this.setInfo = setInfo;
		autoBind(this);
	}
	
}

export default CanvasRenderer;

