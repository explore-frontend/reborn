# vue-apollo-model
一个基于Apollo的Vue.js状态管理方案

> 注意，项目目前还处于探索期，标记为`beta`的功能请谨慎使用

## 为什么不采用vue-apollo
vue-apollo是Akryum所编写的出色框架，能够将GraphQL无缝集成进Vue.js。

然而对于状态管理方案来说，我们更倾向于将状态管理抽离出来管理，而非与组件耦合。
但是又不满足于Vuex/Redux等将状态完全抽离成全局状态管理。

在一个Web应用中，会同时存在**全局状态**与**局部状态**两种，前者生命周期贯穿于整个应用，而后者生命周期依赖于具体的某个业务组件。

故经过多次尝试后，我们推出了自己的基于GraphQL与Observable的状态管理方案。

在**2018 Vue Conf Hangzhou**上，有一部分关于此框架雏形的介绍，如有兴趣请移步至这里观看[再谈Vue SSR -- 响应式数据流在快手游戏直播中的应用](https://www.bilibili.com/video/av37909507/)

## 特点
1. 状态管理尽可能声明式
2. 生命周期与组件生命周期一致，Model的生命周期取决于所绑定的到的组件
3. 适配Vue SSR模式，使开发者尽可能少的思考CSR与SSR模式下的状态管理区别