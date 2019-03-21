const baseConfig = require('./webpack.base.conf');
const merge = require('webpack-merge');
const path = require('path');

module.exports = merge(baseConfig, {
  mode: 'development',
  devServer: {
    port: 8081, // 端口
    contentBase: path.resolve(__dirname, '../dist'), // 静态文件目录
    hot: true, // 是否热更新
    compress: true, // 是否开启Gzip压缩
    host: 'localhost', // 主机
  }
});