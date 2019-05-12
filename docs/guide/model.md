# Model

## 定义Model

```javascript
import { BaseModel, apolloQuery } from '@ks/vue-apollo-model';
import gql from 'graphql-tag';

export default class ProfileModel extends BaseModel {
    id = '';
    @apolloQuery({
        query: gql`
            query userInfo($id: String) {
                userInfo(id: $id) {
                    name
                    description
                    sex
                }
            }
        `,
        initState: {
            userInfo: {
                name: '',
                description: '',
                sex: '',
            },
        },
        prefetch: true,
        skip() {
            return !this.id;
        },
        variables($route) {
            return {
                id: $route.params.od
            };
        },
    })
    userInfoQuery;

    get userInfo() {
        return this.userInfoQuery.userInfo;
    }
}
```

## BaseModel
每一个VueApolloModel构造函数都应继承自BaseModel，BaseModel上定义了一系列属性与方法，具体参见[BaseModel](../api/base-model.md)

## apolloQuery
定义一个query查询，具体参见[apolloQuery](../api/apollo-query.md)
