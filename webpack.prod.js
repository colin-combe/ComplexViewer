require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
//note - this isn't getting used, think  theres some problem with babel
module.exports = merge(common, {
    mode:"production",
    module: {
        rules: [
            {
                test: /\.(js)$/,
                use: "babel-loader",
                exclude: /node_modules/
            }
        ]
    }
});
