import React, { Component } from 'react';
import utils from './utils';
import autoBind from 'react-autobind';

class menu extends Component {
	mouseDownCP = false;

	state = {
		quoteIndex: 0,
		quoteDelay: 1000,
		quoteFade: 2000,
		quoteOpacity: 1,
		quotes: [
			'Point and click to move',
			'Absorb globs that are smaller than you',
			'Fear globs that are bigger than you'
		],
		nick: sessionStorage.nick || '',
		color: sessionStorage.color === undefined ? utils.getRandomInt(0,360): sessionStorage.color,
		isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
	}

	
	showNextQuote() {
		function fade(el,time,start,end,callback) {
			el.setState({quoteOpacity: start});
			let begin = +new Date();
			let goal = begin + time;
			let diff = end - start;
			let tick = function() {
				let now = +new Date();
				if (now > goal){
					
					el.setState({quoteOpacity: end});
					callback();
					return;
				}
				let op = diff * (now-begin)/(goal-begin);
				el.setState({quoteOpacity: start <= end ? op : 1 + op});
				requestAnimationFrame(tick);
			};
			tick();
		}
		
		fade(this,this.state.quoteFade,1,0,() => {
			this.setState({
				quoteIndex: (this.state.quoteIndex + 1) % this.state.quotes.length
			});

			fade(this,this.state.quoteFade,0,1, () => {
				setTimeout(this.showNextQuote,this.state.quoteDelay);
			});
		});
	}
	
	colorPickerInput(x){
		x = Math.floor(Math.min(Math.max(x,0), 360));
		let canvas = this.colorPicker.current;
		let ctx = canvas.getContext('2d');
		
		for(let i=0;i < canvas.width;i++){
			ctx.beginPath();
			ctx.rect(i, 0, 1, canvas.height);
			ctx.fillStyle = utils.x2c(i * 2);
			ctx.fill();
		}

		ctx.lineWidth = 5;
		ctx.strokeStyle = 'rgba(0,0,0,0.5)';
		ctx.beginPath();
		ctx.moveTo(x / 2, 0);
		ctx.lineTo(x / 2, canvas.width);
		ctx.stroke();
		
		this.setState({color: x});
		sessionStorage.color = x;
	}
	
	constructor(props){
		super(props);
		autoBind(this);
		this.colorPicker = React.createRef();
		setImmediate(() => this.colorPickerInput(this.state.color));
		setTimeout(this.showNextQuote, this.state.quoteDelay);
	}

	begin(mode){
		sessionStorage.nick = this.state.nick;
		this.props.begin(mode, this.state.nick, this.state.color);
	}

	colorUpdate(e){
		const rect = this.colorPicker.current.getBoundingClientRect();
		this.colorPickerInput((e.clientX - rect.left) * 2);
	}

	mouseMove(e){
		if(this.mouseDownCP)this.colorUpdate(e);
	}

	mouseDown(e){
		this.mouseDownCP = true;
		this.colorUpdate(e);
	}


	render() {
		return (
			<div id='home' style={{display: this.props.show ? 'block' : 'none'}}>
				<div id='messages'>
					<div id='not-chrome' style={{display: this.state.isChrome ? 'none': 'block'}}>
						Hello there. You are not using Google Chrome. Strange things might happen in other browsers. You can download it <a href='https://www.google.com/chrome/browser/'>here</a>  
					</div>
				</div>
				

				<div id='menu'>
					<div id='colorDiv'>
						<canvas id='colorPicker' width='180' height='20'
							ref={this.colorPicker} 
							onMouseDown={this.mouseDown}
							onMouseUp={() => this.mouseDownCP = false}
							onMouseMove={this.mouseMove}/>
						<input id='colorNum' type='number' min='0' max='360'
							value={this.state.color}
							style={{color: utils.x2c(this.state.color)}}
							onChange={e => this.colorPickerInput(e.target.value)}/>
					</div>
					<h1>Globule</h1>
					<p className='quotes' style={{opacity: this.state.quoteOpacity}}>{this.state.quotes[this.state.quoteIndex]}</p>
					
					<input id='nick' placeholder='Nickname' value={this.state.nick}
						onKeyPress={e => {if(e.keyCode === 13)this.begin('play');}}
						onChange={e => this.setState({nick: e.target.value})}/><br/>
					<input id='play' type='button' value='Play' onClick={() => this.begin('play')}/>
					<input id='spectate' type='button' value='Spectate' onClick={() => this.begin('spectate')}/>
					
					<div id='connecting'>
						Connecting Please Wait...
					</div>
				</div>

				<div id='links'>
					<a href='https://brandanwaldvogel.com'>Main Page</a> | 
					<a href='/about'>About/Credits</a>
				</div>
			</div>
		);
	}
}

export default menu;