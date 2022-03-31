# Client

在Model中所需要使用的请求实例

## 创建Client
```typescript
import { createClient } from 'vue-apollo-model';

// 注册RestClient
const restClient = createClient('rest', options);

// 注册GQLClient（暂不可用
const gqlClient = createClient('gql', options);
```

## 注册拦截器
```typescript
// 请求拦截器
restClient.interceptors.request.use((params) => {
    if ('id' in params) {
        params.id = 1;
    }
    return params;
});

// 响应拦截器
restClient.interceptors.response.use(({ data }) => {
    if (data.result === 1) {
        return data.data;
    }
    throw data;
}, (error) => {
    console.error(error);
    throw error;
});
```

详细`options`配置与`拦截器配置`，请参考[createClient](../api/client.md#createclient)