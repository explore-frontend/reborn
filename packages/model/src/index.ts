import type { RebornClient } from './types';
import type { storeFactory } from './store';

import { useModel, createStore } from './api';

import { createClient } from './clients';

export { useXStream } from './utils';
export {
    BaseModel,
    createModel,
    useGQLMutation,
    useRestMutation,
    useGQLQuery,
    useRestQuery,
} from './model';

export {
    gqlQuery,
    gqlMutation,
    restQuery,
    restMutation,
} from './operations/decorators';

export {
    createStore,
    useModel,
    createClient,
};

// Vue3里面就不需要这个了，可以挂在config.globalProperties上
declare module 'vue/types/vue' {
    interface Vue {
        rebornStore: ReturnType<typeof storeFactory>;
        rebornClient: RebornClient;
    }
}

export type {
    QueryResult,
    MutationResult,
} from './operations/types';

export type {
    FNModelCreator,
} from './model';