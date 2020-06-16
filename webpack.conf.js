require('webpack');
const path = require('path');


module.exports = {
    entry: path.resolve(__dirname + '/src/js/app.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'complexviewer.js',
        library: ['complexviewer'],
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
                loader: 'url-loader',
                // options: {
                //     limit: 8192,
                // },

            },
            {
                test: /\.(js)$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    devServer: {
        contentBase: path.join(__dirname),
        compress: true,
        port: 9000
    }
};
