# 安装

### 1. 依赖安装
```shell
npm i --save vue-apollo-model graphql apollo-client apollo-link-http apollo-cache-inmemory apollo-link-schema graphql-tag xstream
```
或
```shell
yarn add vue-apollo-model graphql apollo-client apollo-link-http apollo-cache-inmemory graphql-tag apollo-link-schema xstream
```

在你的应用中创建一个ApolloClient实例

```javascript
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

export default new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
        // 接口相对应的绝对路径
        uri: 'http://localhost:5100/graphql',
    }),
});
```
::: tip 注意
服务端渲染需要传入不同的ApolloClient实例，详情请参考[服务端渲染](./server-side-render.md)
:::


### 2. 安装插件到 Vue

```javascript
import VueModel from 'vue-apollo-model';
import Vue from 'vue';

Vue.use(VueModel);
```

### 3. 定义全局Store
```javascript
import { Store } from 'vue-apollo-model';
export default function createApp({
    graphqlClient = createApolloClient()
}) {
    const app = new Vue({
        render: (h) => h(mainApp),
        store: new Store(graphqlClient),
        router,
    });
    return {
        app,
        router,
    };
}

```

现在，您已经完成成所有的准备工作，可以开始使用VueApolloModel了