# apolloQuery

在Model上定义一个查询Query

## 选项

### query
GraphQL文档，定义一个graphql query查询

例如
```javascript
{
    query: gql`
        query userInfo($id: String) {
            userInfo(id: $id) {
                name
                description
                sex
            }
        }
    `
}
```

### variables
对象或返回对象的响应式函数，执行query查询时所携带的参数。

例如：
```javascript
{
    variables: {
        id: 1
    }
}
```
或
```javascript
{
    variables($route) {
        return {
            id: this.id || $route.params.id
        };
    }
}
```
如果使用的是variables函数，则函数中第一个函数为当前vue-router的$route，this指向为当前model。

### prefetch
布尔值，是否启用服务端预取，默认值为false。

例如：
```javascript
{
    prefetch: false
}
```

### skip
布尔值或者返回布尔值的响应式函数，是否忽略当前查询，默认值为false。
例如：
```javascript
{
    skip: true
}
```
或
```javascript
{
    skip($route) {
        return !this.id && !$route.params.id
    }
}
```
如果使用的是skip函数，则函数中第一个函数为当前vue-router的$route，this指向为当前model。

### fetchPolicy
query缓存模式，具体请参考[ApolloClient watchQuery](https://www.apollographql.com/docs/react/api/apollo-client#ApolloClient.watchQuery)


### initState
初始状态定义。

在query请求阶段，初始字段默认设定为null，如有特殊需求，比如需要制定默认值等，请使用initState进行定义，Model在初始化query的时候会自动进行assign操作。

例如
```javascript
{
    initState: {
        userInfo: {
            name: '',
            description: '',
            sex: '',
        },
    }
}
```


## 方法

### refetch
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::
重新获取查询，可选择使用新变量。具体可参考[ApolloClient refetch](https://www.apollographql.com/docs/react/api/apollo-client/#ApolloClient.reFetchObservableQueries)

### fetchMore
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::
为分页加载更多数据，具体可参考[ApolloClient fetchMore](https://www.apollographql.com/docs/react/api/apollo-client#ObservableQuery.fetchMore)