const svgToMiniDataURI = require('mini-svg-data-uri');
const webpack = require('webpack');
const path = require('path');

const config = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js'
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader'
                    }
                ]
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            generator: (content) => svgToMiniDataURI(content.toString())
                        }
                    }
                ]
            }
        ]
    }
};

module.exports = config;
