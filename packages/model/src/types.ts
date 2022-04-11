import type { createGQLQuery, createRestQuery } from './operations';
import type { FNModelCreator } from './model';
import type {
    GQLQueryOptions,
    GQLMutationOptions,
    RestQueryOptions,
    RestMutationOptions,
} from './operations/types';
import type { Client } from './operations/types';
import type { EffectScope } from './dep';

export type ModelInfo<T = unknown> = {
    constructor: FNModelCreator<T> | Constructor<T>;
    instance: OriginalModelInstance<T> | null;
    count: number;
    queryList: Array<ReturnType<typeof createRestQuery | typeof createGQLQuery>>;
    scope: EffectScope;
}

export type ModelMap = Record<string, ModelInfo>

export type Constructor<T> = new (...args: any[]) => T;

export type ModelCotrInfo<T> = {
    type: 'FunctionlModel' | 'ClassModel';
    cotr: (client?: RebornClient) => OriginalModelInstance<T>;
};

export type OriginalModelInstance<T> = {
    model: T;
    destroy: () => void;
};

export type ModelMetadata<T extends unknown = unknown> = {
    type: 'gqlQuery';
    detail: GQLQueryOptions<T>;
} | {
    type: 'gqlMutation';
    detail: GQLMutationOptions<T>;
} | {
    type: 'restQuery';
    detail: RestQueryOptions<T>;
} | {
    type: 'restMutation';
    detail: RestMutationOptions<T>;
};

export type FetchPolicy = 'cache-and-network'
    | 'cache-first'
    | 'network-first'
    | 'network-only'
    | 'cache-only';


export type RebornClient = {
    gql?: Client,
    rest?: Client,
};