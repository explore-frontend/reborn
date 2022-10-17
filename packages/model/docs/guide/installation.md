# 安装

### 1. 依赖安装
```shell
// 使用npm
npm i --save vue-apollo-model xstream
// 使用yarn
yarn add vue-apollo-model xstream
// 使用pnpm
pnpm add vue-apollo-model xstream
```

:::tip
``vue-apollo-model``依赖``@vue/composition-api``
:::
### 2. 定义全局Store并安装使用
```typescript
import { createStore, createClient } from 'vue-apollo-model';
import CompositionAPI, { createApp, h } from '@vue/composition-api';

Vue.use(CompositionAPI);

const restClient = createClient('rest', {
    method: 'post',
    timeout: 10 * 1000,
});

const app = createApp({
    router,
    render: () => h(App),
});

// 拦截器配置
restClient.interceptors.request.use((params) => {
    return params;
});

restClient.interceptors.response.use(({ data }) => {
    if (data.result === 1) {
        return data.data;
    }
    throw data;
});

// 配置全局Store
const store = createStore();

// 注册对应的Client
store.registerClient('REST', restClient);

// 绑定Store与app实例的关系
app.use(store);

app.mount('#app');
```

现在，您已经完成成所有的准备工作，可以开始使用VueApolloModel了
