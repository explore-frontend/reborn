import type { DocumentNode } from 'graphql';
import type { Route } from 'vue-router';
import type { Method, HTTPHeaders, RestParams, GQLQueryParams, FetchPolicy } from '../clients';

export type VariablesFn<T> = (this: T, route: Route) => Record<string, any>;
export type MutationVariablesFn<T> = (this: T, params: any, route: Route) => Record<string, any>
export type BooleanFn<T> = (this: T, route: Route) => boolean;
export type NumberFn<T> = (this: T, route: Route) => number;
export type UrlFn<T> = (this: T, route: Route, variables: Record<string, any> | undefined) => string;

// 和CreateQuery有关的参数部分
type CommonQueryOptions<ModelType extends unknown = unknown, DataType = unknown> = {
    prefetch?: boolean;
    fetchPolicy?: FetchPolicy;
    credentials?: RequestCredentials;
    headers?: HTTPHeaders;
    variables?: VariablesFn<ModelType> | Record<string, any>;
    skip?: BooleanFn<ModelType> | boolean;
    pollInterval?: NumberFn<ModelType> | number;
    updateQuery?(prev?: DataType, next?: DataType): DataType;
    timeout?: number;
}

export type GQLQueryOptions<ModelType extends unknown = unknown, DataType = unknown> = {
    url?: UrlFn<ModelType> | string;
    query: DocumentNode;
} & CommonQueryOptions<ModelType, DataType>

export type RestQueryOptions<ModelType extends unknown = unknown, DataType = unknown> = {
    url: UrlFn<ModelType> | string;
    method?: Method;
} & CommonQueryOptions<ModelType, DataType>

export type GQLFetchMoreOptions = Pick<GQLQueryParams, 'variables'>;
export type RestFetchMoreOption = Pick<RestParams, 'variables'>;


// 和createMutation有关的参数部分
type CommonMutationOptions<ModelType extends unknown = unknown> = {
    credentials?: RequestCredentials;
    headers?: HTTPHeaders;
    variables?: MutationVariablesFn<ModelType> | Record<string, any>;
    timeout?: number;
}

export type GQLMutationOptions<ModelType extends unknown = unknown> = {
    url?: UrlFn<ModelType> | string;
    mutation: DocumentNode;
} & CommonMutationOptions<ModelType>;

export type RestMutationOptions<ModelType extends unknown = unknown> = {
    url: UrlFn<ModelType> | string;
    method?: Method;
} & CommonMutationOptions<ModelType>;

export type QueryResult<T = any> = {
    refetch(): Promise<void>;
    data?: T;
    loading: boolean;
    fetchMore(options: GQLFetchMoreOptions): Promise<void>;
    error: any;
}

export type MutationResult<T, P> = {
    loading: boolean;
    data?: P;
    mutate(args0: T, args1?: any): Promise<void>;
    error: any;
}
