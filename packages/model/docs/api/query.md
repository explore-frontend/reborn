# Query相关API
用于表示一次“查询”行为
## 创建Query

### restQuery
在Class模式的Model上定义一个Rest Query

### useRestQuery
在CompositionAPI模式的Model上定义一个Rest Query
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
    url(variables: Variables, $route) {
        return `/live/${variables.id}`;
    }
}
```
如果使用的是url函数，则函数中第一个参数为当前query定义的variables，第二个函数为当前vue-router的$route；

如果为Class模式的Model，则this指向为当前model。

### method
可选参数，http请求发送的类型，类型同[HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)，默认值为`GET`


### headers
可选参数，http请求发送时所携带的headers。

其中需要关注的部分为`content-type`，请求发送时会根据`content-type`的不同值来决定如何处理`variables`

### variables
对象或返回对象的响应式函数，执行query查询时所携带的参数。

例如：
```typescript
{
    variables: {
        id: 1
    }
}
```
或
```typescript
{
    variables($route) {
        return {
            id: $route.params.id
        };
    }
}
```
如果使用的是variables函数，则函数中第一个函数为当前vue-router的$route；

如果为Class模式的Model，则this指向为当前model。

### skip
布尔值或者返回布尔值的响应式函数，是否忽略当前查询，默认值为false。
例如：
```typescript
{
    skip: true
}
```
或
```typescript
{
    skip($route) {
        return !$route.params.id
    }
}
```
如果使用的是skip函数，则函数中第一个函数为当前vue-router的$route;

如果为Class模式的Model，则this指向为当前model。

### pollInterval
数字值或者返回数字值的响应式函数，是否对当前请求进行轮询，默认值为0ms，即不轮询。
例如：
```typescript
{
    pollInterval: 1000
}
```
或
```typescript
{
    pollInterval($route) {
        return $route.pollInterval || 1000;
    }
}
```
如果使用的是skip函数，则函数中第一个函数为当前vue-router的$route;

如果为Class模式的Model，则this指向为当前model。

### timeout
请求超时时间，如设置，则覆盖全局Client配置的超时时间。

### updateQuery
用于处理调用fetchMore时，对于原有结果的自定义处理模式
```typescript
declare function updateQuery(prev?: DataType, next?: DataType): DataType;
```

## 实例属性/方法

### Class模式的model

#### 属性
##### data
返回当前query的查询结果，其结果为响应式数据（经由Vue.js的reactive函数包装，解构时请注意）

##### loading
布尔值，当前query是否处于请求状态，其结果为响应式数据。

#### error
如果当前query查询发生错误，返回当前query的查询错误信息，其结果为响应式数据；否则为null
#### 方法

##### refetch
重新获取查询，可选择使用新变量。
> 注意refetch返回值为`Promise<void>`，仅用于判断当前命令式调用的请求是否完成，具体结果需要从data/error信息中获取
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::

##### fetchMore
获取更多数据，可选择使用新变量，其中前一次查询与后一起查询时候的数据聚合，由前面定义的updateQuery决定。
> 注意fetchMore返回值为`Promise<void>`，仅用于判断当前命令式调用的请求是否完成，具体结果需要从data/error信息中获取
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::

### CompositionAPI模式的Model

#### 属性
##### info
返回当前query的查询结果，其结果为响应式数据（经由Vue.js的reactive函数包装，解构时请注意），其中包含三个属性：
> 1. data：返回当前query的查询结果
> 2. loading：布尔值，当前query是否处于请求状态，其结果为响应式数据。
> 3. error：如果当前query查询发生错误，返回当前query的查询错误信息，其结果为响应式数据；否则为null
#### 方法

##### refetch
重新获取查询，可选择使用新变量。
> 注意refetch返回值为`Promise<void>`，仅用于判断当前命令式调用的请求是否完成，具体结果需要从data/error信息中获取
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::


##### fetchMore
获取更多数据，可选择使用新变量，其中前一次查询与后一起查询时候的数据聚合，由前面定义的updateQuery决定。
> 注意fetchMore返回值为`Promise<void>`，仅用于判断当前命令式调用的请求是否完成，具体结果需要从data/error信息中获取
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::