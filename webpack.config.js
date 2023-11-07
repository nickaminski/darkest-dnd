const PATH = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/main.ts',
    module: {
        rules: [
            { test: /\.(png|jpe?g|gif|svg)$/i, type: "asset/resource" },
            { test: /\.ts$/, use: 'ts-loader', include: [PATH.resolve(__dirname, 'src')] }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: PATH.resolve(__dirname, 'dist'),
        assetModuleFilename: 'images/[hash][ext][query]',
        clean: true
    },
    plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
    devServer: { static: './dist' }
}