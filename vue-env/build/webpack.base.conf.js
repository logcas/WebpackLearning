const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, '..', 'src', 'main.js'),
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].js',
  },
  module: {
    rules: [{
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.(sc|sa|c)ss$/,
        use: [{
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader'
          },
          {
            loader: 'sass-loader'
          },
        ]
      },
      // 图片处理
      {
        test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 4096,
            fallback: {
              loader: 'file-loader',
              options: {
                name: 'img/[name].[hash:8].[ext]'
              }
            }
          }
        }]
      },
      // SVG处理
      {
        test: /\.(svg)(\?.*)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'imgs/[name].[hash:8].[ext]'
          }
        }]
      },
      // 音频视频文件处理
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 4096,
            fallback: {
              loader: 'file-loader',
              options: {
                name: 'media/[name].[hash:8].[ext]'
              }
            }
          }
        }]
      },
      // 字体文件处理
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 4096,
            fallback: {
              loader: 'file-loader',
              options: {
                name: 'fonts/[name].[hash:8].[ext]'
              }
            }
          }
        }]
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../public', 'index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[hash].css',
    }),
    new VueLoaderPlugin(),
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js',
      '@':  path.resolve(__dirname, '../src'),
      'components': path.resolve(__dirname, '../src', 'components'),
    }
  }
};