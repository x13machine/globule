import React, { Component } from 'react';
import Game from '../shared/game';
import CanvasRenderer from './canvasRenderer'; 
import Socket from './socket';
import autoBind from 'auto-bind';
import utils from './utils';

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
		backgroundPosition: '',
		backgroundSize: '',
		msgs: [],
		msgId: 0,
		canvasWidth: window.innerWidth,
		canvasHeight: window.innerHeight
	}

	begin(mode, name, color){
		this.socket = new Socket();
	
		const error = () => {
			this.setState({
				fail: true,
				playing: false,
				connected: false,
				closeMsg: 'Either your internet connection failed, the game server went down, or something weird is happening. Try reloading the web page.'
			});
		};
		
		this.socket.on('close', error);
		this.socket.on('error', error);
		
			
		this.socket.on('open',() => {
			this.socket.emit('login', {
				name: name,
				w: innerWidth,
				h: innerHeight,
				c: color
			});
		});

		window.onresize = () => {
			this.setState({
				canvasWidth: window.innerWidth,
				canvasHeight: window.innerHeight
			});

			if(this.state.connected){
				this.socket.emit('land', {
					w: innerWidth / this.renderer.zoom,
					h: innerHeight / this.renderer.zoom
				});
			}
		};

		
		// Get the initial game state
		this.socket.on('start', payload => {
			this.game = new Game(payload.settings);
			this.game.uuid = payload.uuid;
			this.game.name = payload.name;

			this.renderer = new CanvasRenderer(this.canvas.current, this.game, this.socket, this.setState);
			// Start the renderer.
			this.renderer.render();
	
			this.setState({connected: true});
			
			if (mode !== 'spectate')this.socket.emit('join');
			
		});
		
		// A new client joins.
		this.socket.on('join', payload =>  {
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
				color: utils.x2a(payload.c),
				uuid: payload.u
			};

			this.game.join(payload);
		});
		
		this.socket.on('remap', payload =>  {
			if(!(payload.u in this.game.state.globs))return ;
			let glob = this.game.state.globs[payload.u];
			glob.x = payload.x;
			glob.y = payload.y;
			glob.r = payload.r;
		});
		
		this.socket.on('shoot', payload =>  {
			if(!(payload.u in this.game.state.globs))return ;

			let glob = this.game.state.globs[payload.u];
			glob.r = payload.r;
			glob.x = payload.x;
			glob.y = payload.y;
			glob.vx = payload.X;
			glob.vy = payload.Y;
		});
		
		this.socket.on('rating' ,payload => {
			this.game.rating = payload;
		});

		this.socket.on('players', payload => {
			this.renderer.players = payload;
		});
		
		this.socket.on('rank', payload => {
			this.renderer.rank = payload;
		});
		
		this.socket.on('closeMsg', closeMsg => {
			this.setState({closeMsg});
		});
		
		this.socket.on('leaderboard', leaderboard => {
			this.setState({
				leaderboard: leaderboard.map((entry,id) => {
					return {
						id: id + 1,
						name: entry[0],
						rating: entry[1],
						color: utils.x2c(entry[2]) 
					};
				})
			});
		});
		
		this.socket.on('state', () => {
			this.game.state.globs = {};
		});
		
		// A client leaves.
		this.socket.on('leave', payload => {
			this.game.leave(this.game.state.globs[payload]);
			if(payload === this.game.uuid){
				let score = Math.round(this.game.rating);

				this.setState({
					playing: false,
					deadMenu: true,
					score: score
				});
				
				this.renderer.players--;
				this.game.rating = null;
			}
		});
		
		this.socket.on('chat', payload => {
			this.state.msgs.push({
				id: this.state.msgId,
				nick: payload.n,
				color: utils.x2c(payload.c),
				text: payload.t
			});
			
			this.state.msgId++;
			this.setState({msg: this.state.msg});
			this.chatLogs.current.scrollTop = this.chatLogs.current.scrollHeight;
		});
		
		this.socket.on('chatE', allow => {
			if(allow)this.state.chatInput = '';
			this.setState({allowChat: allow});
		});
		
		this.socket.on('chatQ', payload =>  {
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

	lx = 0;
	ly = 0;

	canvasClick(e){
		if(!this.state.connected)return;
		this.setState({deadMenu: false});
		
		let player = this.game.state.globs[this.game.uuid];
		if (!player) {//is playing
			return;
		}
		
		// Consider where the player is positioned.
		let px = (player.x - this.renderer.mapCord.x) * this.renderer.zoom;
		let py = (player.y - this.renderer.mapCord.y) * this.renderer.zoom;
		// Get the angle of the shot
		let angle = Math.atan2(e.nativeEvent.offsetY - py, e.nativeEvent.offsetX - px);
		this.socket.emit('shoot', { direction: angle });
	}
	

	
	canvasMouseDown() {
		if (this.game.state.globs[this.game.uuid] || this.state.fail || !this.state.connected)return;
		this.setState({cursor: 'move'});
	}
	
	canvasMouseUP() {
		if (this.game.state.globs[this.game.uuid] || this.state.fail || !this.state.connected)return;
		this.setState({cursor: 'default'});
	}
	
	canvasMouseMove(e) {
		if (this.game.state.globs[this.game.uuid] || this.playing || !this.state.connected)return;
		let mx = e.nativeEvent.offsetX / this.renderer.zoom;
		let my = e.nativeEvent.offsetY / this.renderer.zoom;
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
					width={this.state.canvasWidth}
					height={this.state.canvasHeight}
					style={{
						cursor: this.state.cursor,
						backgroundPosition: this.state.backgroundPosition,
						backgroundSize: this.state.backgroundSize,
					}}/>

				<table id='leaderboard'>
					<tbody>
						{this.state.leaderboard.map(entry => <tr key={entry.id}>
							<td>#{entry.id}</td>
							<td style={{color: entry.color}}>{entry.name}</td>
							<td>{entry.rating}</td>
						</tr>)}
					</tbody>
				</table>
				<div id='info'>{this.state.info}</div>
				<div id='deadMenu' style={{display: this.state.deadMenu ? 'block': 'none'}}>
					<div id='deadClose' onClick={() => this.setState({deadMenu: false})}>&#10006;</div>
					<h1 id='deadScore'>{this.state.score}</h1>
					<button id='respawn' className='button' onClick={() => this.socket.emit('join')}>Respawn</button>
				</div>
				<div id='error' style={{display: this.state.fail ? 'block' : 'none'}}>
					<h1>Error</h1>
					<p id='closeMsg'>{this.state.closeMsg}</p>
				</div>
				<div id='blBox'>
					<div id='chatroom' style={{display: this.state.showChat ? 'block': 'none'}}>
						<div id='chatLogs' ref={this.chatLogs}>
							{this.state.msgs.map(msg => <div key={msg.id}>
								<span style={{color: msg.color}}>{msg.nick}: </span>
								<span>{msg.text}</span>
							</div>)}
						</div>
						<input id='chatInput'
							maxLength='200'
							disabled={!this.state.allowChat}
							onKeyPress={e => {if(e.nativeEvent.keyCode === 13)this.sendChat();}}
							onChange={e => this.setState({chatInput: e.target.value})}
							value={this.state.chatInput}/>
						<button className='button' id='chatSend' onClick={this.chatSendButton}>{this.state.allowChat ? 'SEND' : 'CANCEL'}</button>
					</div>
					<button type='button' id='chatToggle' className='button'
						style={{display: this.state.connected ? 'inline-block' : 'none'}}
						onClick={() => this.setState({showChat: !this.state.showChat})}>
						{this.showChat ? 'Show Chat' : 'Hide Chat'}
					</button>
					<input type='button' id='join' className='button' value='Join' 
						style={{display: this.state.playing ? 'none' : 'inline-block'}}
						onClick={() => this.socket.emit('join')}/>
				</div>
			</div>
		);
	}
}

export default Client;