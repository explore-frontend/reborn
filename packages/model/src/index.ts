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
    isEmptyState,
    isLoadingState,
    isDoneState,
    isErrorState,
    isRefreshState,
    isRefreshErrorState,
    isLoadingLikeState,
    isDoneLikeState,
    isErrorLikeState,
    assertLoadingLikeState,
    assertDoneLikeState,
    assertErrorLikeState,
    assertEmptyState,
    assertLoadingState,
    assertDoneState,
    assertErrorState,
    assertRefreshState,
    assertRefreshErrorState,
} from './operations/status';

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