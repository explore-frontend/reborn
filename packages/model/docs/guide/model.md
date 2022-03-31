# Model

## 定义Model

### 使用Class模式定义Model
```typescript
import type { QueryResult, MutationResult } from 'vue-apollo-model';

import { UserModel } from './user';
import {
    BaseModel,
    restQuery,
    restMutation,
} from 'vue-apollo-model';

type CartState = {
    rawItems: string[];
};

type Item = {
    name: string;
    amount: number;
};

export class CartModel extends BaseModel {
    @restQuery<CartModel>({
        url: '/purchaseList'
    })
    private purchasedListQuery!: QueryResult<{
        list: Item[];
    }>;

    get purchasedList() {
        return this.purchasedListQuery.data?.list || [];
    }

    @restMutation<CartModel>({
        url: '/purchase',
        method: 'post',
    })
    private purchaseMutation!: MutationResult<{
        idList: string[];
    }, {
        status: string;
    }>;

    async purchaseItems(idList: string[]) {
        const user = this.getModelInstance(UserModel);
        if (user?.userInfo.value === undefined) {
            return;
        }

        if (this.purchaseMutation.loading) {
            return;
        }

        await this.purchaseMutation.mutate({
            idList,
        });

        if (this.purchaseMutation.data?.status === 'success') {
            this.purchasedListQuery.refetch();
        }
    }
}
```

#### BaseModel
每一个VueApolloModel构造函数都应继承自BaseModel，以保证Model创建的合法性校验，具体参见[BaseModel](../api/model.md#basemodel)

<!-- #### apolloQuery
定义一个query查询，具体参见[apolloQuery](../api/query.md)

#### apolloMutation
定义一个query查询，具体参见[apolloMutation](../api/mutation.md) -->

#### restQuery
定义一个query查询，具体参见[restQuery](../api/query.md)

#### restMutation
定义一个mutation变更，具体参见[restMutation](../api/mutation.md)

### 使用CompositionAPI模式定义Model
```typescript
import { UserModel } from './user';
import { computed } from '@vue/composition-api';
import { createModel, useRestQuery, useRestMutation } from 'vue-apollo-model';

type CartState = {
    rawItems: string[];
};

type Item = {
    name: string;
    amount: number;
};

export const CartModel = createModel(({ getModelInstance }) => {
    const { info, refetch } = useRestQuery<{
        list: Item[];
    }>({
        url: '/purchaseList',
    });

    const purchasedList = computed(() => info.data?.list || []);

    const purchaseMutation = useRestMutation<{
        status: string;
    }>({
        url: '/purchase',
        method: 'post',
    });

    async function purchaseItems(idList: string[]) {
        const user = getModelInstance(UserModel);
        if (user?.userInfo.value === undefined) {
            return;
        }

        if (purchaseMutation.loading) {
            return;
        }

        await purchaseMutation.mutate({
            idList,
        });

        if (purchaseMutation.data?.status === 'success') {
            refetch();
        }
    }

    return {
        purchasedList,
        purchaseItems,
    };
});
```

#### createModel
定义一个query查询，具体参见[createModel](../api/model.md#createmodel)

#### useRestQuery
定义一个query查询，具体参见[useRestQuery](../api/query.md)

#### useRestMutation
定义一个mutation变更，具体参见[useRestMutation](../api/mutation.md)