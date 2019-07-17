import React, { Component } from 'react';
import Menu from './menu';
import Client from './client';
import ReactDOM from 'react-dom';
import autoBind from 'react-autobind';

class Main extends Component {
	client = {};

	state = {
		tab: 'menu',
	}

	begin(mode, nick, color){
		this.clientBegin(mode, nick, color);
		this.setState({tab: 'client'});
	}
	
	constructor(){
		super();
		autoBind(this);
	}
	render() {
		return (
			<React.Fragment>
				<Menu show={this.state.tab === 'menu'} begin={this.begin}/>
				<Client show={this.state.tab === 'client'} setBegin={f => this.clientBegin = f}/>
			</React.Fragment>
		);
	}
}

ReactDOM.render(<Main/>, document.querySelector('#main'));

export default Main;