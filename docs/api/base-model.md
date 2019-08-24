# BaseModel

## $streams
:::tip
`beta`功能，后续可能会有改动
:::

每一个在model上定义的属性，都会在this.$streams产生一个结尾增加`$`的Stream（基于xstream），用于流式编程组合拼装。

比如
```javascript
this.$streams.userInfoQuery$.debug(() => console.log('我被重新触发了一次变更'))
```

## subscriptions
:::tip
`beta`功能，后续可能会有改动
:::

定义一个subscriptions方法，用于组合流，并根据返回结果，在Model上产生一个同名属性用于订阅流的最新值，如果流命名以$为结尾，同名属性值会忽略此结尾

比如
```javascript
class ProfileModel extends BaseModel {
    id = 0;
    subscriptions() {
        const evenId$ = this.$streams.id$
            .filter(id => id % 2 === 0)
        return {
            evenId$
        };
    }

    get tip() {
        return `上一次查询的偶数id为${this.evenId}`;
    }
}
```