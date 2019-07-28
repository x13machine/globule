

let main = {
	resolve: {
		extensions: ['.js','.jsx']
	},
	stats: 'errors-only',
	mode: 'development',
	module: {
		rules: [
			{
				test: /.jsx?$/,
				loader: 'babel-loader',
				options: {
					presets: [
						'@babel/preset-env',
						'@babel/react',{
							'plugins': ['@babel/plugin-proposal-class-properties']
						}
					]
				}
			}
		]
	},
};

module.exports = {
	...main,
	output: {
		path: __dirname + '/../static',
		filename: './js/index.js',
	},
	entry: [
		'./index.jsx',
	]
};
