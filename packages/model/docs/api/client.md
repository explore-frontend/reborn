# Client相关API

## createClient
> 创建一个client实例

### RestClient Options
```typescript
type ClientOptions = {
    // 请求方法，默认为GET
    method: "get" | "post" | "delete" | "put" | "patch" | "options" | "head" | "trace" | "connect";
    // 对于全局fetch的替换，默认使用window.fetch进行实际请求发送
    fetch?: typeof fetch;
    // 同fetch的credentials，设定Cookie携带方式，默认为"include"
    credentials?: "include" | "omit" | "same-origin";
    // 请求携带的HTTP Header，其中content-type默认为'application/json'
    headers?: HTTPHeaders;
    // 请求超时时间配置，默认为60s
    timeout?: number;
}

```

<!-- ### GQLClient Options
```typescript
type ClientOptions = {
    // 请求方法，默认为GET
    method: "get" | "post" | "delete" | "put" | "patch" | "options" | "head" | "trace" | "connect";
    // 对于全局fetch的替换，默认使用window.fetch进行实际请求发送
    fetch?: typeof fetch;
    // 同fetch的credentials，设定Cookie携带方式，默认为"include"
    credentials?: "include" | "omit" | "same-origin";
    // 请求携带的HTTP Header，其中content-type默认为'application/json'
    headers?: HTTPHeaders;
    // 请求超时时间配置，默认为60s
    timeout?: number;
}

``` -->

### 拦截器
> 在请求发起前/发起后对请求/响应的数据进行拦截和替换
```TypeScript
// 请求拦截器设置
type TransformRequest = (params: any) => any;

// 响应拦截器设置
type TransformResponse = (result: any) => Promise<any>;

type Interceptor = {
    use(onResolve: TransformRequest | TransformResponse, onReject?: TransformRequest | TransformResponse): void;
}
```
