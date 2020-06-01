# Model

## 定义Model

```typescript
import {
    BaseModel,
    apolloQuery,
    QueryResult,
    apolloMutation,
    MutationResult,
} from 'vue-apollo-model';
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
    userInfoQuery!: QueryResult<{
        userInfo: {
            name: string;
            description: string;
            sex: 'male' | 'female' | '';
        }
    }>;

    get userInfo() {
        return this.userInfoQuery.data.userInfo;
    }

    @apolloMutation({
        mutation: gql`
            mutation commit($data: String) {
                commit(data: $data) {
                    result
                }
            }
        `,
        variables({ data }: CommitParams) {
            return {
                data,
            };
        },
    })

    feedbackMutation!: MutationResult<CommitParams, {
        sendFeedback: {
            result: number;
        };
    }>;

    async sendFeedback(commitParams: CommitParams) {
        await this.feedbackMutation.mutate(commitParams);
    }
}
```

## BaseModel
每一个VueApolloModel构造函数都应继承自BaseModel，BaseModel上定义了一系列属性与方法，具体参见[BaseModel](../api/base-model.md)

## apolloQuery
定义一个query查询，具体参见[apolloQuery](../api/apollo-query.md)

## apolloMutation
定义一个query查询，具体参见[apolloMutation](../api/apollo-mutation.md)
