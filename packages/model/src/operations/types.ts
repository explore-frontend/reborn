import type { Method, HTTPHeaders, RestParams, GQLQueryParams, FetchPolicy, DocumentNode, RequestCredentials } from '../clients';
import type { getCurrentInstance } from 'vue-demi';

type InstanceProxy = Exclude<Exclude<ReturnType<typeof getCurrentInstance>, null>['proxy'], null>;
export type Route = InstanceProxy extends { $route: infer R } ? R : unknown;

export type VariablesFn<T, VariablesType = Record<string, any>> = (this: T, route: Route) => VariablesType;
export type MutationVariablesFn<T, VariablesType = Record<string, any>, ParamsType = any> = (
    this: T,
    params: ParamsType,
    route: Route,
) => VariablesType;
export type BooleanFn<T> = (this: T, route: Route) => boolean;
export type NumberFn<T> = (this: T, route: Route) => number;
export type UrlFn<T, VariablesType = Record<string, any>> = (
    this: T,
    route: Route,
    variables: VariablesType | undefined,
) => string;
export type MutationUrlFn<T, VariablesType = Record<string, any>, ParamsType = Record<string, any>> = (
    this: T,
    route: Route,
    variables: VariablesType | undefined,
    params: ParamsType,
) => string;

// 和CreateQuery有关的参数部分
type CommonQueryOptions<ModelType extends unknown = unknown, DataType = unknown, VariablesType = unknown> = {
    prefetch?: boolean;
    fetchPolicy?: FetchPolicy;
    credentials?: RequestCredentials;
    headers?: HTTPHeaders;
    variables?: VariablesFn<ModelType, VariablesType> | VariablesType;
    skip?: BooleanFn<ModelType> | boolean;
    pollInterval?: NumberFn<ModelType> | number;
    updateQuery?(prev?: DataType, next?: DataType): DataType;
    timeout?: number;
};

export type GQLQueryOptions<
    ModelType extends unknown = unknown,
    DataType = unknown,
    VariablesType = Record<string, any>,
> = {
    url?: UrlFn<ModelType, VariablesType> | string;
    query: DocumentNode;
} & CommonQueryOptions<ModelType, DataType, VariablesType>;

export type RestQueryOptions<
    ModelType extends unknown = unknown,
    DataType = unknown,
    VariablesType = Record<string, any>,
> = {
    url: UrlFn<ModelType, VariablesType> | string;
    method?: Method;
    /**
     * 发起请求前钩子，可以修改发送的 url 以及 variables
     * @param params
     */
    beforeQuery?(params: {
        url: string;
        variables: VariablesType | undefined;
    }): undefined | { url?: string; variables?: VariablesType };
} & CommonQueryOptions<ModelType, DataType, VariablesType>;

export type GQLFetchMoreOptions = Pick<GQLQueryParams, 'variables'>;
export type RestFetchMoreOption = Pick<RestParams, 'variables'>;

// 和createMutation有关的参数部分
type CommonMutationOptions<ModelType extends unknown = unknown, VariablesType = unknown, ParamsType = unknown> = {
    credentials?: RequestCredentials;
    headers?: HTTPHeaders;
    variables?: MutationVariablesFn<ModelType, VariablesType, ParamsType> | VariablesType;
    timeout?: number;
};

export type GQLMutationOptions<ModelType extends unknown = unknown, VariablesType = unknown, ParamsType = unknown> = {
    url?: MutationUrlFn<ModelType, VariablesType, ParamsType> | string;
    mutation: DocumentNode;
} & CommonMutationOptions<ModelType>;

export type RestMutationOptions<ModelType extends unknown = unknown, VariablesType = unknown, ParamsType = unknown> = {
    url: MutationUrlFn<ModelType, VariablesType, ParamsType> | string;
    method?: Method;
} & CommonMutationOptions<ModelType>;

export type QueryResult<T = any> = {
    refetch(): Promise<void>;
    data?: T;
    loading: boolean;
    fetchMore(options: GQLFetchMoreOptions): Promise<void>;
    error: any;
};

export type MutationResult<T, P> = {
    loading: boolean;
    data?: P;
    mutate(args0: T, args1?: any): Promise<void>;
    error: any;
};
