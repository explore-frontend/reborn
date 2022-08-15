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

export type {
    QueryResult,
    MutationResult,
} from './operations/types';

export type {
    FNModelCreator,
} from './model';