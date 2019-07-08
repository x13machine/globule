import React, { Component } from 'react';
import Menu from './menu';

class Main extends Component {
	render() {
		return (
			<div>
				<Menu/>
				<Game/>
			</div>
		);
	}
}

React.createElement(<Main/>,document.querySelector('#main'));

export default Main;