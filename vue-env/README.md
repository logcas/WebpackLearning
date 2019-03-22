# 搭建Vue开发环境

(这篇文章的配置是基于这个配置开始的：https://github.com/logcas/WebpackLearning/tree/master/spa)

好了，我要开始装逼了。

以前用Vue都是直接用`vue-cli`梭哈一把就可以了。但是后来发现（主要是面试被问到），没有自己配过Webpack是不行了。现在我们就顺了上面的势头，手动搭建一个Vue开发环境。

首先参考资料肯定是官方文档：https://vue-loader.vuejs.org/

## 基本配置
首先肯定是安装依赖：
```
cnpm install vue-loader vue-template-compiler -D
```

然后按照官方文档的指引，我们在`webpack.base.conf.js`中添加对应的`vue-loader`和`vue-template-compiler`插件：

```js
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  }
};
```

**必须注意：要在`resolve`上添加字段`alias`。**

对于这个插件，官方是这样说的：
```
这个插件是必须的！ 它的职责是将你定义过的其它规则复制并应用到 .vue 文件里相应语言的块。例如，如果你有一条匹配 /\.js$/ 的规则，那么它会应用到 .vue 文件里的 <script> 块。
```

也就是说它可以把`.vue`文件中`<script>`标签中的脚本交给对应处理样式的`loader`去处理，JS同理。

然后现在我们安装`vue`并且在`src`目录新建一个根组件`App.vue`，并且修改入口文件`main.js`的内容，测试一下`vue`能否正常运行：
```
npm install vue -S
```

```vue
// App.vue
<template>
  <div>
    <h1>{{msg}}</h1>
  </div>
</template>

<script>
export default {
  name: 'app',
  data() {
    return {
      msg: 'Hello,Vue!'
    }
  }
}
</script>
```

```js
// main.js
import Vue from 'vue';
import App from '@/App.vue';

new Vue({
  render: h => h(App)
}).$mount('#app');
```

然后我们执行`npm run dev`，在开发环境下运行，打开`http://localhost:8081`。

Nice！基本的环境已经搭建成功了！

![](./screenshot/基本搭建1.png)

但是我们还有很长的路要走。

## 处理资源路径
在之前的基本配置中，我们把处理资源路径交给了`url-loader`和`file-loader`，它们可以把引入到脚本文件中的资源文件路径都处理好。但是它们是不处理在`html`标签上引用的路径的，例如这样：
```html
<img src="../image.png">
```

如果在之前的配置的环境中我们要处理上面的情况，就需要用到别的插件。

但是，当我们使用`vue-loader`解析`.vue`文件时，模板中类似于上面结构的引入会被转换成`Webpack`模块请求：
```js
createElement('img', {
  attrs: {
    src: require('../image.png') // 现在这是一个模块的请求了
  }
})
```

因此，即使我们要从`html`标签上引入资源文件，`vue-loader`也可以帮助我们完成资源路径的转换。当转换成`Webpack`模块请求后，就看而已通过`file-loader`或者`url-loader`去处理了。

以下转换规则来自于官方文档：
1. 如果路径是绝对路径 (例如 /images/foo.png)，会原样保留。
2. 如果路径以 . 开头，将会被看作相对的模块依赖，并按照你的本地文件系统上的目录结构进行解析。
3. 如果路径以 ~ 开头，其后的部分将会被看作模块依赖。这意味着你可以用该特性来引用一个 Node 依赖中的资源：
```html
<img src="~some-npm-package/foo.png">
```
4. 如果路径以 @ 开头，也会被看作模块依赖。如果你的 webpack 配置中给 @ 配置了 alias，这就很有用了。所有 vue-cli 创建的项目都默认配置了将 @ 指向 /src

在这里，我们把目光转向第四点。直接我们直接用`vue-cli`创建项目时，我们在开发中可以直接使用`@/components/xxxx`作为路径，其中`@`指向了`src`目录，是因为它已经帮我们在`Webpack`配置文件中写好了别名`alias`。当然，这个我们自己也可以去定义，这样的话我们就可以减少一些路径上的错误了。

我们来修改`webpack.base.conf.js`，为它添加一些东西：
```js
resolve: {
  alias: {
    vue: 'vue/dist/vue.js',
    '@':  path.resolve(__dirname, '../src'),
    'components': path.resolve(__dirname, '../src', 'components'),
  }
}
```

在上面的配置，我们定义了`@`别名，用来指向`src`目录的为止，这样我们引入文件的时候就可以使用`import xxx from '@/xxx.vue'`这样的形式来表明从`src`目录下的`xxx.vue`文件；另外我们还定义了`components`别名，用来指向`src/components`目录，更方便我们的引入。同时它们在`html`标签的引入中也是有效的。

然后当你重新构建时，就可以生效了，不信可以试试。

## 处理样式
实际上你会发现，并不需要处理任何样式问题，样式依然可以正常。那我们还要处理什么样式问题呢？

Vue官方提供了一个叫`vue-style-loader`的东西，它是基于`style-loader`去开发的，同时也是`vue-loader`的依赖和解析CSS默认使用的`loader`。那它和`style-loader`有什么不同？从官方的说明上表示，它支持服务端渲染。对于SSR，目前笔者实际上也不太懂，但是为了更接近`vue-cli`生成的配置，我们就用它来代替`style-loader`把。

当我们打开`webpack.base.conf.js`时就会发现，我们早已使用`MiniCssExtractPlugin.loader`代替`style-loader`，以便于CSS样式代码的提取和分离。

但是`vue-loader`官方文档上有这么一段话：`请只在生产环境下使用 CSS 提取，这将便于你在开发环境下进行热重载。`。意思就是当开发环境下我们最好使用`vue-style-loader`，因为它不会提取CSS，便于本地开发服务器的热重载；而当我们需要打包构建成在生产环境运行的代码时，我们可以使用`MiniCssExtractPlugin.loader`进行样式的分离。

基于以上的问题，我们就要开始修改配置文件。这时候我们就要结合Node.js中的`process.env.NODE_ENV`去判断是生产环境还是开发环境，以便于我们修改配置文件，确认使用哪一个loader。

```js
// webpack.base.conf.js
// 篇幅优先，仅保留更新部分

module.exports = {
  module: {
    rules: [
      {
        test: /\.(sc|sa|c)ss$/,
        use: [{
            loader: process.env.NODE_ENV !== 'production' ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
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
};
```

em.....如果我们直接运行`npm run build`的话，Windows平台下可能会发现并没有分离样式，也就是说`process.env.NODE_ENV`并没有产生作用。（其他平台可能是正常的）

然后我把`package.json`中的`scripts`更改成了这样：
```json
  "scripts": {
    "build": "set NODE_ENV=production && webpack --config build/webpack.prod.conf.js",
    "dev": "set NODE_ENV=development && webpack-dev-server --config build/webpack.dev.conf.js --open"
  },
```

然后还是不行，也就是说Windows平台下`set NODE_ENV=production`可能会出问题。所以我把目光投向了万能的搜索引擎，找到了一个叫`cross-env`的包，它可以帮助我们解决跨平台下设置`NODE_ENV`的问题。

首先依然是下载这个包：
```
npm install cross-env -D
```

然后就把`package.json`中的`scripts`更改成这样子：
```json
  "scripts": {
    "build": "cross-env NODE_ENV=production webpack --config build/webpack.prod.conf.js",
    "dev": "cross-env NODE_ENV=development webpack-dev-server --config build/webpack.dev.conf.js --open"
  },
```

执行`npm run build`，成功分离样式！

## 复制`public`文件夹的内容
如果通过`vue-cli 3`来创建一个项目，它会生成一个`public`文件夹，里面包含一个`index.html`和`favicon.ico`。通过`vue-cli`的官方文档可知，`public`文件夹的内容是在构建时直接复制到`dist`目录的，而不通过`loader`作任何处理。至于`public`文件夹中应该什么时候利用它，官方作了如下说明：

1. 你需要在构建输出中指定一个文件的名字。
2. 你有上千个图片，需要动态引用它们的路径。
3. 有些库可能和 webpack 不兼容，这时你除了将其用一个独立的 <script> 标签引入没有别的选择。

就目前而言，笔者是没有动过`public`里面的内容。但是为了搭建一个更完整的Vue开发环境，笔者选择通过`copy-webpack-plugin`的插件来实现文件夹内容的复制。

首先通过npm安装它：
```
npm install copy-webpack-plugin -D
```

然后把插件引入到`webpack.base.conf.js`：
```js
// 篇幅优先，仅显示关键配置
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyWebpackPlugin([
      { from: path.resolve(__dirname, '../public'), to: path.resolve(__dirname, '../dist') }
    ])
  ]
}
```

## 使用`browserslist`
`browserslist`是在不同的前端工具之间共用目标浏览器和 node 版本的配置工具。它主要被以下工具使用：

1. `autoprefixer`
2. `babel`
3. `post-preset-env`
4. `eslint-plugin-compat`
5. `stylelint-unsupported-browser-features`
6. `postcss-normalize`

以上所有工具都会通过`browserslist`自动查找当前项目的目标浏览器范围，同时`browserslist`也说明了当前项目支持的浏览器范围。我们可以通过两种方法去设置：

1. 在`package.json`中添加`browserslist`字段，例如：
```json
{
  "browserslist": [
    "last 1 version",
    "> 1%",
    "maintained node versions",
    "not dead"
  ]
}
```

2. 在项目根目录中添加`.browserslistrc`文件，并写入一些查询规则：
```
# Browsers that we support

last 1 version
> 1%
maintained node versions
not dead
```

这里的话笔者选择了第二种方法，因为对于一些如`.babelrc`这类的配置，笔者还是比较喜欢把它们单独出一个文件。所以这里就在根目录下创建了一个`.browserslistrc`文件，并且参照了`vue-cli`的默认配置：
```
> 1%
last 2 versions
not ie <= 8
```

上面的规则表示：份额大于1%的浏览器、最新的两个版本、不支持IE8及以下。

当然，你可以根据项目的实际状况去填写，更多介绍可以查看它们的官方文档：https://github.com/browserslist/browserslist

## 使用`ESlint`
`ESlint`是一个代码校验的工具，对于团队协作开发时，代码风格统一有着很重要的作用，使用`ESlint`可以帮助我们解决这个问题。

安装：
```
npm install eslint eslint-loader eslint-plugin-vue -D
```

然后我们在`webpack.base.conf.js`中`rules`数组添加一个校验规则：
```js
// 省略了其他配置信息
  module: {
    rules: [
      {
        enforce: 'pre', // 前置处理
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      },
    ]
  }
```

这个配置信息需要注意的一点是，需要添加`enforce: 'pre'`的字段，使得在文件被`eslint-loader`处理前不被其他`loader`处理。尤其是需要在`babel-loader`前，因为通过`babel-loader`处理后，代码已经不是原来的样子，这时用`eslint`简直白搞。

然后我们在根目录下添加一个`.eslintrc`去说明配置：
```js
module.exports = {
  extends: [
    "plugin:vue/essential"
  ]
}
```

实际上具体的配置还要结合自己项目的实际需求，详细配置信息可以查阅官方文档。

# 结语
OK，基本的搭建已经完成，优化的话笔者对于`Webpack`还是入门级别，还需要多学习这方面的知识才能完善优化这方面的内容。

前端真的好多东西啊！！！