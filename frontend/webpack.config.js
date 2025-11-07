const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: './src/app.ts',
    mode: 'development',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 9001,
        historyApiFallback: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            // Обработка TypeScript
            {
                test: /\.ts$/i,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            // Обработка SCSS
            {
                test: /\.scss$/i,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader",
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
        }),
        new CopyPlugin({
            patterns: [
                {from: "./src/templates", to: "templates"},
                {from: "./src/static/images", to: "images"},
                {from: "./node_modules/admin-lte/plugins/fontawesome-free/webfonts", to: "webfonts"},
                {from: "./node_modules/admin-lte/plugins/fontawesome-free/css/all.min.css", to: "css"},
                {from: "./node_modules/admin-lte/dist/css/adminlte.min.css", to: "css"},
                {from: "./node_modules/admin-lte/plugins/jquery/jquery.min.js", to: "js"},
                {from: "./node_modules/admin-lte/plugins/bootstrap/js/bootstrap.bundle.min.js", to: "js"},
                {from: "./node_modules/admin-lte/dist/js/adminlte.min.js", to: "js"},
            ],
        }),
    ],
};


// npm run dev     будет запускать сборку в режиме разработки
// npm run build   в режиме продакшена.
// npm run type-check  для проверки типов без сборки

