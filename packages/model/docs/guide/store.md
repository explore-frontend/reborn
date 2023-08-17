# Store

store是用于全局存储Model实例的集合，后续会在Model中提供跨Model引用的模式。

## 创建Store
创建一个Store，并绑定app使用
```typescript
import { createStore } from 'vue-apollo-model';
import Vue from 'Vue';

const store = createStore();

app.use(store);
```
## 注册Rest/GQL对应的Client
注册对应client，**注意** client为单例模式
```typescript
// 注册Rest Client
const restClient = createClient('REST')
store.registerClient(restClient);
// 注册GQL Client，暂不可用
const gqlClient = createClient('GQL')
store.registerClient(gqlClient);
```
