require("webpack");
const path = require("path");
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: "development",
    devtool: "eval-source-map",
    module: {
        rules: [
            // { todo - use bable for production mode - https://webpack.js.org/guides/production/
            //     test: /\.(js)$/,
            //     use: 'babel-loader',
            //     exclude: /node_modules/
            // }
        ]
    },
    devServer: {
        contentBase: path.join(__dirname),
        compress: true,
        port: 9000
    }
});
