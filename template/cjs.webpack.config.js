const svgToMiniDataURI = require('mini-svg-data-uri');
const webpack = require('webpack');
const path = require('path');

const config = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js'
    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            esModule: false
                        }
                    }
                ]
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            generator: (content) => svgToMiniDataURI(content.toString()),
                            esModule: false
                        }
                    }
                ]
            }
        ]
    }
};

module.exports = config;
