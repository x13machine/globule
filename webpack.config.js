

const main = {
	resolve: {
		extensions: ['.js','.jsx']
	},
	stats: 'errors-only',
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	},
};

module.export = [
	Object.assign({}, main,{
		output: {
			path: __dirname + '/static',
			filename: './js/index.js',
		},
		entry: [
			'./client/index.jsx',
		]
	}),
];
