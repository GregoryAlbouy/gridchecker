const path = require("path");

const config = {
    mode: "production",
    entry: "./src/gridchecker.ts",
    devtool: 'false',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.html$/i,
                loader: 'html-loader',
            },
            {
                test: /\.css$/i,
                use: ['to-string-loader', 'css-loader'],
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "./gridchecker.min.js"
    },
    watchOptions: {
        ignored: /node_modules/
    }
}
  
module.exports = config