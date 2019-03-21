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
import App from './App.vue';

new Vue({
  el: '#app',
  components: { App },
  template: '<app />'
});
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