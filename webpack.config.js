const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: path.join(__dirname, "src", "index.js"),
	output: {
		path: path.resolve(__dirname, "build"),
		filename: './index.bundle.js',
		publicPath: ''
	},
	devServer: {
		port: 3010,
		open: false,
		historyApiFallback: true
	},
    watchOptions: {
        ignored: [
            path.resolve(__dirname, 'dist'),
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, 'build'),
            path.resolve(__dirname, 'cache')
        ]
    },
    module: {
		rules: [
			{
				test: /\.jsx?$/i,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			},
			{
				test: /\.css$/i,
				use: [
					"style-loader",
					{
						loader: 'css-loader',
						options: {
							importLoaders: 1,
							modules: true
						}						
					}
				],
      			include: /\.module\.css$/,
			},
			{
				test: /\.css?$/i,
				use: ['style-loader', 'css-loader'],
				exclude: /\.module\.css$/
			},
			{
				test: /\.(png|jp(e?)g|svg|gif|mp3|webp)$/,
				type: "asset/resource"
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(__dirname, "public", "index.html"),
			favicon: "./public/assets/icon.ico"
		})
	]
}