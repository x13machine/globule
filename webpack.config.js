
var main = {
	resolve: {
		extensions: ['.js','.jsx']
	},
	stats: 'errors-only',
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.jsx$/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	}
};

module.exports  =[
	Object.assign({}, main,{
		output: {
			filename: './static/js/main.js',
		},
		entry: [
			'./client/main.jsx',
		]
	}),
];
