# Model相关API
## 创建Model
### BaseModel
> Class模式定义Model

每一个Model构造函数都应继承自BaseModel；

其中BaseModel会提供getModelInstance的protected实例方法：

```typescript
declare class BaseModel {
    protected getModelInstance: GetModelInstance;
}
```
### createModel
> CompositionAPI模式定义Model

其中BaseModel会提供getModelInstance的protected实例方法：
```typescript
type FNModelConstructor<T> = (ctx: {
    getModelInstance: GetModelInstance;
}) => T;

declare function createModel<T>(fn: FNModelConstructor<T>): FNModelCreator<T>;
```

### getModelInstance
当你需要在一个Model中访问全局存在的另一个Model实例的时候，请使用getModelInstance。
getModelInstance并不会创建一个新的Model实例，而是将当前全局已实例化的Model实例返回

## 使用Model
### useModel
每一个Model在组件中使用的时候，都是全局单例的存在；且Model的生命周期跟随组件生命周期保持一致。

当使用useModel时，vue-apollo-model会在全局store中创建一个新的Model单例，或更新Model单例的引用计数；
当使用Model的组件销毁后，vue-apollo-model会对计数进行更新；
当引用计数为0时，vue-apollo-model会销毁对应Model实例。

