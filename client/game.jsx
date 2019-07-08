import React, { Component } from 'react';

class Game extends Component {
	render() {
		return (
			<div id='game'>
				<canvas id='canvas'></canvas>
				<div id='error'>
					<h1>Error</h1>
					<p id='closeMsg'>Either your internet connection failed the game server went down, or something weird is happening. Try reloading the web page.</p>
				</div>
				<div id='leaderboard'></div>
				<div id='info'></div>
				<div id='deadMenu'>
					<div id='deadClose'>X</div>
					<h1 id='deadScore'></h1>
					<p id='deadMessage'></p>				
					<button id='respawn' class='button'>Respawn</button>

				</div>
				<div id='blBox'>
					<div id='chatroom'>
						<div id='chatLogs'></div>
						<input id='chatInput' maxlength='200'/><button class='button' id='chatSend'>SEND</button>
					</div>
					<input type='button' id='chatToggle' class='button' value='Show Chat'/><input type='button' id='join' class='button' value='Join'/>
				</div>
			</div>
		);
	}
}

export default Game;