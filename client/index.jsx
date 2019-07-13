import React, { Component } from 'react';
import Menu from './menu';
import Client from './client';

class Main extends Component {
	client = {};

	state = {
		tab: 'menu',
	}

	begin(mode, nick, color){
		this.client.begin(mode, nick, color);
		this.setState({tab: 'client'});
	}
	
	render() {
		return (
			<div>
				<Menu show={this.tab === 'menu'} begin={this.begin}/>
				<Client show={this.tab === 'client'} state={this.state.client}/>
			</div>
		);
	}
}

React.createElement(<Main/>,document.querySelector('#main'));

export default Main;