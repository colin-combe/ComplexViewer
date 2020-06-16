require("webpack");
const path = require("path");


module.exports = {
    entry: path.resolve(__dirname + "/src/controller/Controller.js"),
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "complexviewer.js",
        library: ["ComplexViewer"]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: "babel-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".js", ".jsx"]
    },
    devServer: {
        contentBase: path.join(__dirname),
        compress: true,
        port: 9000
    }
};
