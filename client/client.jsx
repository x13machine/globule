import React, { Component } from 'react';
import Game from '../shared/game';
import CanvasRenderer from './canvasRenderer'; 
import Socket from './socket';
import autoBind from 'react-autobind';

class Client extends Component {
	game = new Game();


	state = {
		connecting: true,
		closeMsg: null,
		leaderboard: [],
		fail: false,
		deadMenu: false,
		speculate: false,
		playing: false,
		connected: false,
		cursor: 'default',
		chatInput: '',
		allowChat: true,
		showChat: false,
		info: '',
		score: 0,
		msgs: [],
		msgId: 0
	}

	begin(mode, name, color){
		this.socket = new Socket();
		this.game = new Game({
			rating: null,
			uuid: null,
			socket: this.state
		});
	
		function error(){
			this.setState({
				fail: true,
				playing: false,
				connected: false,
				closeMsg: 'Either your internet connection failed, the game server went down, or something weird is happening. Try reloading the web page.'
			});
		}
		
		this.socket.on('close', error);
		this.socket.on('error', error);
		
		this.renderer = new CanvasRenderer(this.canvas.current, this.game, this.socket, info => this.setState({info}));
		// Start the renderer.
		this.renderer.render();
			
		this.socket.on('open',() => {
			console.log('open');
			this.socket.emit('login', {
				name: name,
				w: innerWidth,
				h: innerHeight,
				c: color
			});
		});
		
		
		// Get the initial game state
		this.socket.on('start', payload => {
			this.setState({connected: true});
			
			//clone payload
			this.game.uuid = payload.uuid;
			this.game.name = payload.name;
			this.game = new Game(payload.settings);
			this.renderer.game = this.game;
			this.renderer.started = true;
			
			if (mode != 'spectate') {
				this.socket.emit('join');
				this.setState({playing: true});
			}
			
		});
		
		// A new client joins.
		this.socket.on('join', function(payload) {
			if(payload.u === this.game.uuid){
				this.renderer.zoom = 1;
				this.setState({
					playing: true,
					deadMenu: false,
					cursor:'default'
				});
			}
			
			payload = {
				...payload,
				vx: payload.X,
				vy: payload.Y,
				type: payload.t,
				color: payload.c,
				uuid: payload.c
			};

			this.game.join(payload);
		});
		
		this.socket.on('remap', function(payload) {
			if(payload.u in this.game.state.globs[payload.u]){
				this.game.state.globs[payload.u] = {
					...this.game.state.globs[payload.u],
					...payload
				};
			}
		});
		
		this.socket.on('shoot', function(payload) {
			this.game.state.globs[payload.u] = {
				...this.game.state.globs[payload.u],
				...{
					r: payload.r,
					x: payload.x,
					y: payload.y,
					vx: payload.X,
					vy: payload.Y
				}
			};
		});
		
		this.socket.on('rating' ,function(payload){
			this.game.rating = payload;
		});
		
		this.socket.on('players',function(payload){
			this.renderer.players = payload;
		});
		
		this.socket.on('rank',function(payload){
			this.renderer.rank = payload;
		});
		
		this.socket.on('closeMsg',function(closeMsg){
			this.setState({closeMsg});
		});
		
		this.socket.on('leaderboard', leaderboard => {
			this.setState(leaderboard);
		});
		
		this.socket.on('state',function(){
			this.game.state.globs = {};
		});
		
		// A client leaves.
		this.socket.on('leave', function(payload) {
			this.game.leave(this.game.state.globs[payload]);
			if(payload === this.game.uuid){
				let score = Math.round(this.game.rating);

				this.state.setState({
					playing: false,
					deadMenu: true,
					score: score
				});
				
				this.renderer.players--;
				this.game.rating = null;
			}
		});

		window.onresize = () => {
			this.socket.emit('land', {
				w: innerWidth / this.renderer.zoom,
				h: innerHeight / this.renderer.zoom
			});
		};
		
		this.socket.on('chat', function(payload) {
			this.state.msgs.push({
				id: this.state.msgId,
				nick: payload.n || 'NO NAME',
				color: 'rgb('+payload.c[0]+','+payload.c[1]+','+payload.c[2]+')',
				text: payload.t
			});
			
			this.state.msgId++;
			this.setState({msg: this.state.msg});
			this.chatLogs.current.scrollTop = this.chatLogs.current.scrollHeight;
		});
		
		this.socket.on('chatE', function(allow) {
			if(allow)this.state.chatInput = '';
			this.setState({allowChat: allow});
		});
		
		this.socket.on('chatQ', function(payload) {
			this.setState({chatInput: 'YOU ARE '+ payload[0] + ' OUT OF ' + payload[1]});
		});
	}

	sendChat(){
		if(this.state.chatInput === '')return ;
		
		this.socket.emit('chat', this.state.chatInput);
		this.setState({
			chatInput: '',
			allowChat: false
		});
	}

	chatSendButton() {
		if(this.state.allowChat){
			this.sendChat();
		}else{
			this.socket.emit('chatC');
		}
	}

	canvasClick(e){
		this.setState({deadMenu: false});
		
		let player = this.game.state.globs[this.game.uuid];
		if (!player) {//is playing
			return;
		}
		
		// Consider where the player is positioned.
		let px = (player.x - this.renderer.mapCord.x) * this.renderer.zoom;
		let py = (player.y - this.renderer.mapCord.y) * this.renderer.zoom;
		// Get the angle of the shot
		let angle = Math.atan2(e.offsetY - py, e.offsetX - px);
		this.socket.emit('shoot', { direction: angle });
	}
	
	lx = 0;
	ly = 0;
	
	canvasMouseDown() {
		if (this.game.state.globs[this.game.uuid] || this.state.fail) {
			return;
		}
		this.setState({cursor: 'move'});
	}
	
	canvasMouseUP() {
		if (this.game.state.globs[this.game.uuid] || this.state.fail)return;
		this.setState({cursor: 'default'});
	}
	
	canvasMouseMove(e) {
		if (this.game.state.globs[this.game.uuid] || this.playing) {
			return;
		}
		let mx = e.offsetX / this.renderer.zoom;
		let my = e.offsetY / this.renderer.zoom;
		if(e.buttons === 1){
			this.renderer.mapCord.x += this.lx - mx;
			this.renderer.mapCord.y += this.ly - my;
			this.socket.emit('cam',{
				x: Math.round(this.renderer.canvas.width / 2 / this.renderer.zoom + this.renderer.mapCord.x),
				y: Math.round(this.renderer.canvas.height / 2 / this.renderer.zoom + this.renderer.mapCord.y)
			});
		
		}
		
		this.renderer.camFit();
		
		this.lx = mx;
		this.ly = my;
	}

	constructor(props){
		super(props);
		autoBind(this);
		this.canvas = React.createRef();
		this.chatLogs = React.createRef();
		props.setBegin(this.begin);
	}
	
	render() {
		return (
			<div id='game' style={{display: this.props.show ? 'block' : 'none'}}>
				<canvas id='canvas'
					ref={this.canvas}
					onClick={this.canvasClick}
					onMouseDown={this.canvasMouseDown}
					onMouseUp={this.canvasMouseUP}
					onMouseMove={this.canvasMouseMove}
					style={{cursor: this.state.cursor}}/>

				<table id='leaderboard'>

				</table>
				<div id='info'>{this.state.info}</div>
				<div id='deadMenu' style={{display: this.state.deadMenu ? 'block': 'none'}}>
					<div id='deadClose' onClick={() => this.setState({deadMenu: false})}>X</div>
					<h1 id='deadScore'>{this.state.score}</h1>
					<button id='respawn' className='button' onClick={() => this.socket.emit('join')}>Respawn</button>
				</div>
				<div id='error' style={{display: this.state.fail ? 'block' : 'none'}}>
					<h1>Error</h1>
					<p id='closeMsg'>{this.state.closeMsg}</p>
				</div>
				<div id='blBox'>
					<div id='chatroom'>
						<div id='chatLogs' ref={this.chatLogs}>
							{this.state.msgs.map(msg => <div key={msg.id}>
								<span style={{color: msg.color}}>{msg.nick}</span>
								<span>{msg.text}</span>
							</div>)}
						</div>
						<input id='chatInput' maxLength='200' disabled={!this.state.allowChat} onKeyPress={e => {if(e.keyCode === 13)this.endChat();}}/>
						<button className='button' id='chatSend' onClick={this.chatSendButton}>{this.state.allowChat ? 'SEND' : 'CANCEL'}</button>
					</div>
					<button type='button' id='chatToggle' className='button'
						style={{display: this.state.connected ? 'inline-block' : 'none'}}
						onClick={() => this.setState({showChat: !this.state.showChat})}>
						{this.showChat ? 'Show Chat' : 'Hide Chat'}
					</button>
					<input type='button' id='join' className='button' value='Join' 
						style={{display: this.state.playing ? 'block' : 'none'}}
						onClick={() => this.socket.emit('join')}/>
				</div>
			</div>
		);
	}
}

export default Client;