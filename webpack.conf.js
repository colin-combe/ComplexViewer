const webpack = require('webpack');
const path = require('path');

const config = {
    entry: './src/controller/Controller.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'complexviewer.js',
        library: ['xiNET']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};

module.exports = config;