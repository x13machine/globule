import React, { Component } from 'react';

import utils from './utils';
import client from './client';

class menu extends Component {
	state = {
		quoteIndex: 0,
		quoteDelay: 1000,
		quoteFade: 2000,
		quotes: [
			'Point and click to move',
			'Absorb globs that are smaller than you',
			'Fear globs that are bigger than you'
		]
	}

	showNextQuote() {
		quoteIndex++;
		var quote = quotes[quoteIndex % quotes.length];
		quote.style.display = 'block';
		utils.fade(quote,quoteFade,0,1,function(){
			setTimeout(function(){
				utils.fade(quote,quoteFade,1,0,function(){
					quote.style.display = 'none';
					showNextQuote();
				});
			},quoteDelay);
		});
	}
	
	showNextQuote();
	constructor(props){
		super(props);
	}

	render() {
		return (
			<div id='home'>
				<div id='messages'>
					<div id='motd'>
					</div>
					<div id='not-chrome'>
						Hello there. You are not using Google Chrome. Strange things might happen in other browsers. You can download it <a href='https://www.google.com/chrome/browser/'>here</a>  
					</div>
				</div>
				

				<div id='menu'>
					<div id='colorDiv'>
						<canvas id='colorPicker' width='180' height='20'></canvas>
						<input id='colorNum' type='number' min='0' max='360'/>
					</div>
					<h1>Globule</h1>
					<p class='quotes'>{this.state.quotes[this.state.index]}</p>
					
					<input id='nick' placeholder='Nickname'/><br/>
					<input id='play' type='button' value='Play'/>
					<input id='spectate' type='button' value='Spectate'/>
					
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