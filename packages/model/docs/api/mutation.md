# Mutation相关API

用于表示一次“变更”行为

## 创建Mutation

### restMutation
在Class模式的Model上定义一个Rest Mutation

### useRestMutation
在CompositionAPI模式的Model上定义一个Rest Mutation
## 选项

### url
字符串或者返回字符串的一个函数。

例如：
```typescript
{
    url: '/live/26391'
}
```
或
```typescript
{
    url(variables: any, $route) {
        return `/live/${variables.id}`;
    }
}
```
如果使用的是url函数，则函数中第一个参数为当前mutation定义的variables，第二个函数为当前vue-router的$route；

如果为Class模式的Model，则this指向为当前model。
### method
可选参数，http请求发送的类型，类型同[HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)，默认值为`GET`

### headers
可选参数，http请求发送时所携带的headers。

其中需要关注的部分为`content-type`，请求发送时会根据`content-type`的不同值来决定如何处理`variables`

## 实例属性/方法

### Class模式的model

#### 属性
##### data
返回当前mutation的查询结果，其结果为响应式数据（经由Vue.js的reactive函数包装，解构时请注意）

##### loading
布尔值，当前mutation是否处于请求状态，其结果为响应式数据。

#### error
如果当前mutation查询发生错误，返回当前mutation的查询错误信息，其结果为响应式数据；否则为null
#### 方法

##### mutate
发起mutation请求
> 注意mutate返回值为`Promise<void>`，仅用于判断当前命令式调用的请求是否完成，具体结果需要从data/error信息中获取
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::

### CompositionAPI模式的Model

#### 属性
##### info
返回当前mutation的查询结果，其结果为响应式数据（经由Vue.js的reactive函数包装，解构时请注意），其中包含三个属性：
> 1. data：返回当前mutation的查询结果
> 2. loading：布尔值，当前mutation是否处于请求状态，其结果为响应式数据。
> 3. error：如果当前mutation查询发生错误，返回当前mutation的查询错误信息，其结果为响应式数据；否则为null
#### 方法

##### mutate
发起mutation请求
> 注意mutate返回值为`Promise<void>`，仅用于判断当前命令式调用的请求是否完成，具体结果需要从data/error信息中获取
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::
