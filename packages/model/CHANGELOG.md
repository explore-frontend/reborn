#### 0.4.3 (2024-04-25)

##### Bug Fixes

*  🐛 修复 credentials 设置不生效的问题 (97c49589)

#### 0.4.2 (2024-04-17)

##### New Features

*  🎸 增加model family 相关 api (ddba60fc)

#### 0.4.1 (2024-03-22)

##### Bug Fixes

*  🐛 修复引用计数2 (50a3ce48)

### 0.4.0 (2024-01-15)

##### Bug Fixes

*  🐛 修复引用计数错误导致的 model 提前销毁和重复创建的问题 (32cc27eb)

#### 0.3.11 (2023-12-11)

##### New Features

*  🎸 fetch error 处理, 暴露 fetchError 和 TimeoutError (#90) (e2375186)
*  🎸 去除对 dom 类型的依赖 (76f2d664)

#### 0.3.10 (2023-11-17)

##### New Features

*  🎸 添加 changelog (fcba1db0)

#### 0.3.9

##### New Features

*  🎸 get post 请求默认 content-type (b6b36ade)

#### 0.3.8

##### Bug Fixes

*  🐛 修复 ssr 序列化转义问题 (c65300c8)
*  🐛 修复 mutate 类型 (337bf4c9)

#### 0.3.7

##### New Features

*  🎸 修改默认header 配置项 (#83) (c7b4f11d)

#### 0.3.6

##### New Features

*  🎸 request interceptor type (#82) (745aab1a)

#### 0.3.5

##### Bug Fixes

*  🐛 修复 query status (6c5cf7d5)

#### 0.3.4

##### New Features

*  🎸 get 请求 content-type 默认为x-www-form-urlencoded (1865120c)

#### 0.3.3

##### New Features

*  🎸 useRestQuery 添加 beforeQuery 钩子 (#80) (0b2d8f9d)
*  🎸 新增 createUseModel api 简化 model 的引入方式 (f7e9bb3a)

#### 0.3.2

##### New Features

*  🎸 mutation 的 url 接收 mutate 的 params 参数 (#75) (63a817ac)

##### Bug Fixes

*  🐛 修复 vue2 根组件不能 useModel 的问题 (ef2eb7ef)
*  🐛 复运行环境中没有 DOMException timeout 报出奇怪的错误的问题 (#76) (07e73ed7)
*  🐛 修复 variables route 参数不是响应式的问题 (b966c31f)
