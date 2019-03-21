# 基于Webpack4.x的单页应用开发环境
首先使用`npm init`生成一个配置文件`package.json`。

然后通过以下命令安装`Webpack`依赖包：
```
npm install webpack webpack-cli webpack-dev-server -D
```

现在，我们就要编写Webpack的配置文件。

一般来说，我们开发一个项目时，都分为**开发环境**和**生产环境**。对于开发环境，我们需要搭建一个本地开发服务器，并且可以追踪代码错误的位置等等；而对于生产环境，就要把代码压缩，不跟踪代码的错误位置等。所以，一般都把两个环境的配置文件分开。但是，对于一些`loader`的配置实际上是一样的，我们可以复用公共的配置选项。

因此，我们把配置文件分为三个：
```
webpack.base.conf.js // 公共的基础配置
webpack.prod.conf.js // 生产环境的配置
webpack.dev.conf.js // 开发环境的配置
```

为了更方便管理，我们把它们都放在`build`目录下。

首先我们来编写`webpack.base.conf.js`这部分，先把一个应有的配置总体框架写出来：
```
module.exports = {
  // entry:
  // output:
  // module:
  // plugin: 
}
```

为了更好地说明情况，整个目录结构我们是这样的：
```js
/build // 存放Webpack的配置文件
/src // 存放开发时的源文件
/dist // 存放构建后的目标文件
/public // 存放一些静态资源文件（如index.html）
/config // 存放一些通用配置文件
```

![目录](http://img.lxzmww.xyz/webpack/spa/%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84.PNG)

然后我们对属性逐个编写。

## `entry` 入口
`entry`就是要对`Webpack`说明入口文件，然后`Webpack`会根据入口文件和其中的依赖构建一个依赖图。可以传入一个`string`或`object`。

传入一个`string`是这样的，可以传入一个绝对地址或相对地址：
```javascript
module.exports = {
  entry: path.resolve(__dirname, '..', 'src', 'index.js',
};
```

```javascript
module.exports = {
  entry: '../src/index.js',
};
```

如果传入的是一个`object`，可以说明多个入口，键名为该入口文件的名字（后续的占位符`[name]`）：
```javascript
module.exports = {
  entry: {
    'main': '../src/index.js',
    'app': '../src/app.js',
  },
};
```

这里呢，我们先在`src`目录下创建一个`main.js`文件，然后写上一句简单的`console.log('hello,world')`。然后，我们把`entry`填上，这里我就比较喜欢用`path.resolve`把相对地址转为绝对地址，目前我们的`webpack.base.conf.js`是这样的：
```js
module.exports = {
  entry: path.resolve(__dirname, '..', 'src', 'main.js',
}
```

搞定入口以后，当然要搞打包构建后文件在哪里出来的问题了。

## `output` 出口
`output`说明了通过`Webpack`打包构建后文件出来的位置、文件名等，主要有这样一些属性：
```
module.exports = {
  entry: path.resolve(__dirname, '..', 'src', 'main.js',
  output: {
    path: // 出口文件的目录
    filename: // 文件的名称
    chunkFilename: // 公共块的名称
    publicPath: // 文件输出的公共路径
    pathinfo: // 是否保留依赖包中的注释，但基本不用管，当生产环境下默认不保留，开发环境保留。
  }
}
```

我们进一步把`webpack.base.conf.js`填充：
```js
const path = require('path');
module.exports = {
  entry: path.resolve(__dirname, '..', 'src', 'main.js'),
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].js',
  },
};
```

对于占位符`[name]`，它所代替的就是`entry`中的键名（如果`entry`是对象的话），因为我们用了`string`作为入口，那么它的名字默认为`main`，至于`[hash]`就是哈希值了，这方面主要用于解决缓存的问题，每次构建哈希值都不同，当我们更新模块后，因为哈希值不同了，因此会请求最新的JS文件。

实际上这时候，说明了入口和出口，我们已经可以对它进行构建了，这时我们在终端敲下这样的一个命令：
```
webpack --config build/webpack.base.conf.js
```

然后就构建成功了！

![构建](http://img.lxzmww.xyz/webpack/spa/%E6%9E%84%E5%BB%BA1.PNG)

但是，你会发现最下方有一行黄色的警告，它说你没有指定`mode`。`mode`是为了说明构建的模式是`production`（生产）还是`development`（开发），虽然目前没有指定，但是依然成功了，因为`mode`的默认值为`production`，该模式下默认压缩代码，不信你可以打开`dist`下的文件看看是不是成了一坨。我们现在并不管`mode`，因为我们只是编写公共的配置，还要处理的事情很多呢。

## module 模块
`Webpack`虽然是一个很牛X的打包器，但是它只能识别`JavaScript`和`JSON`文件。对于其他如`TypeScript`、`image`、`font`、`css`等文件，我们需要把它转换为`Webpack`可以识别的代码文件，这时候就需要用到`loader`，而`loader`是在`module`属性中定义的。

### 通过Babel的帮助下把ES6用起来
ES6中有许多我非常喜欢的新东西，例如解构赋值、`let`和`const`、箭头函数等等。但是并不是所有浏览器都支持原生ES6的语法，我们就要通过一些手段把它们转化为低版本的`ECMAScript`，这时`Babel`就登场了。一句话概括，`Babel`是一个可以把新的`ECMAScript`转换成低版本的`ECMAScript`的东西，至于具体介绍请看它的官网了。

我们要用它把我们的ES6语法进行转换，这时候就需要用到`babel-loader`。

这里需要注意的是，`babel-loader 8.x`版本必须与`babel 7.x`配合使用，`babel-loader 7.x`必须与`babel 6.x`配合使用，否则会出错。别问为什么，问就跳楼，官方说的。

我就通过以下命令安装了：
```
npm install -D babel-loader @babel/core @babel/preset-env
```

然后根据官方文档我们可以这样写`loader`：
```js
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ]
  }
```

`test`表示匹配的文件的正则表达式，`exclude`表示剔除这些文件不转码（`node_modules`下的文件肯定不用转了）。

然后在根目录下（也就是`package.json`所在的目录）新建一个配置文件`.babelrc`，写入如下信息：
```json
{
  "presets": ["@babel/preset-env"]
}
```

现在，我们的`webpack.base.conf.js`就成这样的了：
```js
const path = require('path');
module.exports = {
  entry: path.resolve(__dirname, '..', 'src', 'main.js'),
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ]
  }
};
```

这时，我们把`main.js`改成以下的内容，并且把`mode`改为`development`，试试Babel的效果：
```js
const hello = () => {
  console.log('ES6箭头函数');
}

hello();
```

然后又是那条构建语句：
```
webpack --config build/webpack.base.conf.js
```

构建完成后，我们发现代码没有压缩了，然后我们找到`hello`函数：

![babel](http://img.lxzmww.xyz/webpack/spa/babel.PNG)

你会发现箭头函数转化成了普通函数，说明Babel奏效了！

![html](http://img.lxzmww.xyz/webpack/spa/HTML.PNG)

### HTML的插曲
我们目前虽然构建成功了，但是还是看不到效果，因为我们还没有结合HTML文件去加载JS文件。

这时候，为了更好地介绍后面的各种loader，我们就要先插入一段HTML的广告了。

如果我们想要在`index.html`里引入`dist`目录下打包好的JS文件，我们会发现这样一个问题：当我们每打包一次，哈希值就变一次，并且文件名又长又臭，难道每次构建完都要手动修改吗？答案是否定的，如果什么都要手动，还要`Webpack`干嘛。

这时候我们就要用到`plugins`属性了，也就是插件。我们要安装一个名叫`html-webpack-plugin`的包，然后new一个实例到`plugins`数组中。

首先是安装它：
```
npm install html-webpack-plugin -D
```

然后就在`webpack.base.conf.js`中引入它，然后new一个实例，就像这样：
```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
// ... 省略了其他配置
plugins: [
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: path.resolve(__dirname, '../public', 'index.html'),
  }),
]
```

然后我们在`public`目录下写下我们的模板文件之后，又是那个构建命令：
```
webpack --config build/webpack.base.conf.js
```

你就会发现在构建后会在`dist`目录下自动生成一个`index.html`了，并且它是以我们编写的模板为基准，自动插入我们打包好的脚本文件，相当方便啊有木有！

好吧，让我们回到`loader`的问题。

### 搞定样式
我们处理完了`HTML`和`JavaScript`的问题后，现在来处理`CSS`的问题。很显然，`Webpack`依然是不能直接识别`CSS`文件的，因此我们还是需要借助一些`loader`：
1. `style-loader`，把CSS内容构成一个`<style></style>`标签加入到HTML中。
2. `css-loader`，解析CSS文件的内容。

安装它们：
```
npm install style-loader css-loader -D
```

然后修改`webpack.base.conf.js`文件中的`module`属性，其他内容不变：
```js
 module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ]
      },
    ]
  },
```

我们在`src`目录下编写一个`main.css`文件，然后在`main.js`中引入：
```css
/* main.css */
h1 {
  color: blue;
}
```
```js
// main.js
import './main.css';
const hello = () => {
  console.log('ES6箭头函数');
}

hello();
```

然后构建，打开`index.html`文件你会发现`h1`标签的字体已经变成了蓝色，说明已经生效了！！！

![css](http://img.lxzmww.xyz/webpack/spa/HTML-CSS.PNG)

#### 使用SCSS等预处理语言
我们日常更喜欢用SCSS这些去编写样式，因为它们更方便更灵活。因此，我们又需要用loader去解析它们。

对于`scss/sass`，我们需要用到以下两个依赖：
1. `node-sass`
2. `sass-loader`

同样我们也是先安装：
```
npm install node-sass sass-loader -D
```

不需要添加新的`rules`，只需要在原来解析CSS那里添加上`sass-loader`就行了：
```js
// 省略了很多很多...
      {
        test: /\.(sc|sa|c)ss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ]
      },
```

上面表明对于`.scss\.css\.sass`文件，`loader`的处理顺序是`sass-loader => css-loader => style-loader`。因为，`Webpack`中`loader`处理文件的顺序是从右往左的。

然后我们把样式`main.css`更改为`main.scss`，并且在`main.js`中重新引入：
```scss
/* main.scss */
$myColor: blue;
h1 {
  color: $myColor;
}
```

```js
// main.js
import './main.scss';
const hello = () => {
  console.log('ES6箭头函数');
}

hello();
```

然后构建，打开`index.html`，效果依然存在，生效，完毕！

#### 使用`postcss`添加浏览器样式前缀
PostCSS 是一个允许使用 JS 插件转换样式的工具。 这些插件可以检查（lint）你的 CSS，支持 CSS Variables 和 Mixins， 编译尚未被浏览器广泛支持的先进的 CSS 语法，内联图片，以及其它很多优秀的功能。

我们要使用PostCSS来为一些属性自动添加浏览器的前缀，就要安装如下几个包：
```
cnpm install postcss-loader autoprefixer -D
```

然后在原来的`Webpack`基础上修改：
```js
// 同样省略了很多很多。。。
      {
        test: /\.(sc|sa|c)ss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'postcss-loader' },
          { loader: 'sass-loader' },
        ]
      },
```

并且在根目录下创建一个名为`postcss.config.js`的配置文件：
```js
module.exports = {
  plugins: [
    require('autoprefixer')
  ]
}
```

然后，就没有了，因为已经完成了，很简单吧？当然，`PostCSS`的作用肯定不止自动添加前缀，你可以看着文档试试别的。

#### 分离样式
目前为止，我们的样式是写在JS文件上的。通常为了更好地利用缓存机制，我们需要把`.css`文件和`.js`文件分离。分离样式需要用到一个叫`mini-css-extract-plugin`的插件。

先来下载它：
```
cnpm install mini-css-extract-plugin -D
```

然后我们在`plugins`属性中添加它的一个实例，并且把`style-loader`替换成`MiniCssExtractPlugin.loader`：
```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // 省略了其他配置...
  module: {
    rules: [
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
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[hash].css',
    }),
  ]
};
```

然后再次构建，我们就会发现样式文件已经分离到了`dist/css`中。

### 整理我们的`dist`目录
现在我们看一下`dist`目录就会发现，生成了N多个`main.[hash].js`文件。在我们每次构建完后，都会生成一个哈希值不同的打包后的JS文件，这样就会使我们`dist`目录下新旧文件都存在造成混乱而无法管理的问题，毕竟对于`dist`目录，我们是希望把每次新打包的文件都放进去，而旧的就删掉。我们可以通过一个叫`clean-webpack-plugin`的插件去解决这个问题。

首先安装依赖：
```
npm install clean-webpack-plugin -D
```

然后在配置文件`webpack.base.conf.js`中引入：
```js
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  // 省略了其他部分...
  plugins: [
    new CleanWebpackPlugin(),
  ]
};
```

实际上我们可以传入一个自定义的配置，例如`new CleanWebpackPlugin(options)`这样子，`options`是我们自己定义的一个配置对象，但就目前来讲我们使用默认配置就好了。有兴趣的同学可以去npm官网搜索这个插件去阅读它的选项内容。

然后我们可以进行一次构建，就会发现`dist`文件在构建前会被清理掉，然后构建完成后新的文件会重新写入。

### 处理图片、字体、音频文件等资源
目前为止我们已经处理了`JavaScript`、`HTML`和`CSS`的问题，但是对于一个页面来说，几乎肯定是包含图片、字体、音频这些文件的。因为`Webpack`只能处理JS和JSON文件的原因，我们依然需要对应的`loader`去处理这些资源文件，并且为它们正确地引入到页面中。

#### `file-loader`
`file-loader`可以帮我们完成这些事情，它可以帮助我们把开发时引入的资源文件放到正确的位置（也就是帮我们把引用的路径都弄好），首先我们要先安装它的包：
```
cnpm install file-loader -D
```

然后在配置文件`webpack.base.conf.js`写入如下配置：
```js
module.exports = {
  module: {
    rules: [
      // 图片处理
      {
        test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'imgs/[name].[hash:8].[ext]'
          }
        }]
      },
      // SVG处理
      {
        test: /\.(svg)(\?.*)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash:8].[ext]'
          }
        }]
      },
      // 音频视频文件处理
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'media/[name].[hash:8].[ext]'
          }
        }]
      },
      // 字体文件处理
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[hash:8].[ext]'
          }
        }]
      },
    ]
  }
}
```

然后我们在`main.js`中引入一个图片：
```js
// main.js
import './main.scss';
import myImg from './images/2.jpg';

window.onload = function() {
  let img = new Image();
  img.src = myImg;
  document.body.appendChild(img);
}
```

并且在`main.scss`中引入一个背景图：
```scss
body {
  background-image: url(images/1.jpg);
  background-size: 100%;
  background-repeat: no-repeat;
}
```

然后打包构建，打开`dist`目录下的`index.html`文件，你会发现图片正常引入了。

![资源](http://img.lxzmww.xyz/webpack/spa/%E5%A4%84%E7%90%86%E8%B5%84%E6%BA%90.PNG)

#### `url-loader`
我们使用`file-loader`进行对图片、字体等资源的处理，对于每个图片资源我们都有一个地址，也就是说，当我们把页面放上去时，每个图片不管它的大小我们都会发一个请求。但实际上，对于体积很小很小的图片，发请求的效率非常低的。因此，我们要把小体积的资源转换成`base64`编码，直接嵌套在文件中，而减少一次网络请求，这时候就要用到`url-loader`。

实际上，`url-loader`是`file-loader`的一个上层封装，当某个资源的体积小于一定的大小时，我们通过`url-loader`处理，把这个资源转换成`base64`编码；当体育大于某个预设值时，我们就把它交给`file-loader`处理，让它正确处理资源引入的路径。

我们需要先安装`url-loader`：
```
npm install url-loader -D
```

然后修改`webpack.base.conf.js`中对于资源处理`loader`的配置：
```js
    rules: [
      // 图片处理
      {
        test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 4096, // 当体积小于4096字节时，转为base64编码
            fallback: {
              loader: 'file-loader', // 否则的话交给file-loader 去处理
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
```

## 使用`npm script`
直到现在，我们每次构建项目的时候，都要输入一长串的命令，并且要指定构建文件，非常麻烦。为了更方便去执行构建的命令，我们可以使用`npm script`的功能。

我们打开`package.json`，然后在`scripts`属性上加入下面这几行：
```json
"scripts": {
  "build": "webpack --config build/webpack.prod.conf.js",
  "dev": "webpack --config build/webpack.dev.conf.js",
},
```

保存之后，我们以后的每次构建，当我们需要打包成生产环境使用的时候，只需要敲下`npm run build`命令，它会为我们执行后面那一长串的命令；当需要打包成开发环境使用的时候，也就只需要敲下`npm run dev`就可以了。

当然，现在是不行的。因为我们还没有编写`webpack.prod.conf.js`和`webpack.dev.conf.js`。

OK，我们现在就来编写它们！！

## 使用`webpack-merge`
我们基本上已经编写完了公共配置的部分，实际上只需要合并到对应环境的配置文件就可以了。但是我们肯定不是手动复制粘贴过去。这时候就要用到一个叫`webpack-merge`的包，它可以帮我们把公共部分和对应环境特定的配置合并起来。

先安装：
```
npm install webpack-merge -D
```

然后我们分别编写`webpack.prod.conf.js`和`webpack.dev.conf.js`：
```js
// webpack.dev.prod.js
const baseConfig = require('./webpack.base.conf');
const merge = require('webpack-merge');

module.exports = merge(baseConfig, {
  mode: 'production',
});
```

```js
// webpack.dev.conf.js
const baseConfig = require('./webpack.base.conf');
const merge = require('webpack-merge');

module.exports = merge(baseConfig, {
  mode: 'development',
});
```

目前两个构建文件的差别只在`mode`不同，但后面当你真正配置更多东西的时候两个环境的配置是有更大的差别的（例如压缩、使用`dev-tool`、报错显示等等）。

然后我们就可以使用`npm script`去分别构建不同环境的文件了。

## 搭建本地服务器和热更新
目前我们每次调试时都是手动打开`index.html`或者刷新。但是，为了更装逼，我们要搭建一个本地服务器，然后通过`http://localhost:xxxx`去访问它，这时候就要用到`webpack-dev-server`。

`webpack-dev-server`在开篇的时候不知道你有没有注意到，它已经安装了。

由于本地服务器仅在开发时使用，所以我们只需要在`webpack.dev.conf.js`中写就好了。

```js
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
```

然后我们修改`package.json`文件，让开发环境构建使通过`webpack-dev-server`启动：
```json
"scripts": {
  "dev": "webpack-dev-server --config build/webpack.dev.conf.js --open",
},
```

然后本地服务器`http://localhost:8081`就出来了，并且显示`index.html`文件的内容。当我们修改脚本或者样式时，也不需要刷新。

![本地服务器](http://img.lxzmww.xyz/webpack/spa/%E6%9C%AC%E5%9C%B0%E6%9C%8D%E5%8A%A1%E5%99%A8.PNG)

OK，基本的环境就搭建完毕了！（当前目前是没有任何优化的）