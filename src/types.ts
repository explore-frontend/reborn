/**
 * @file 类型声明
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 29, 2018
 */

import Vue from 'vue';
import { Route } from 'vue-router';
import { Stream } from 'xstream';
import { ApolloClient, QueryOptions } from 'apollo-client';

import Store from './store';
import { BaseModel } from './model';
import { DocumentNode } from 'graphql';

export interface StoreModelInstance<T> {
    constructor: Constructor<T>;
    instance: T | null;
    count: number;
}


declare module 'vue/types/options' {
    interface ComponentOptions<V extends Vue> {
        // TODO这个类型不对，后面改一下
        models?: any;
        apolloStore?: Store;
    }
}


declare module 'vue/types/vue' {
    interface Vue {
        apolloStore?: Store;
    }
    interface VueConstructor {
        util: {
            defineReactive: (
                obj: object,
                key: string,
                val?: any,
                customSetter?: (val?: any) => void,
                shallow?: boolean,
            ) => {};
        };
    }
}

interface ModelInfo<T> {
    constructor: Constructor<T>;
    instance: T;
    count: number;
}

export type ModelMap<T extends typeof BaseModel> = Record<string, ModelInfo<T>>

// TODO貌似这个类型定义是不对的，后面看看any是否可被替换
export type StreamsObj = Record<string, Stream<any>>;

export type VariablesFn<T> = (this: T, route: Route) => Record<string, any>
export type MutationVariablesFn<T> = (this: T, params: any, route: Route) => Record<string, any>
export type BooleanFn<T> = (this: T, route: Route) => boolean;
export type NumberFn<T> = (this: T, route: Route) => number;

export interface ApolloQueryOptions<T extends BaseModel> extends QueryOptions {
    client?: string;
    variables?: VariablesFn<T> | Record<string, any>;
    prefetch?: BooleanFn<T> | boolean;
    skip?: BooleanFn<T> | boolean;
    pollInterval?: NumberFn<T> | number;
    initState?: Record<string, any>;
}

export interface RestQueryOptions<T extends BaseModel> {
    url: string;
    method?: 'get' | 'post' | 'delete' | 'put';
    headers?: {
        contentType?: 'applicaton/json' | 'multipart/form-data';
    }
    variables?: VariablesFn<T> | Record<string, any>;
    skip?: BooleanFn<T> | boolean;
    initState?: Record<string, any>;
}

export interface ApolloMutationOptions<T extends BaseModel> {
    client?: string;
    mutation: DocumentNode;
    variables: MutationVariablesFn<T> | Record<string, any>,
    initState?: Record<string, any>;
}

export interface RestMutationOptions<T extends BaseModel> {
    url: string;
    method?: 'get' | 'post' | 'delete' | 'put';
    headers?: {
        contentType?: 'applicaton/json' | 'multipart/form-data';
    }
    variables: MutationVariablesFn<T> | Record<string, any>,
    initState?: Record<string, any>;
}

export interface QueryResult<T = any, P extends BaseModel = any> {
    refetch(): Promise<void>;
    data: T;
    loading: boolean;
    fetchMore(options: ApolloQueryOptions<P>): Promise<void>;
    error: any;
}

export interface MutationResult<T, P> {
    loading: boolean;
    data: P;
    mutate(args0: T): void;
    error: any;
}

export interface GraphqlClients {
    defaultClient: ApolloClient<any>;
    clients: Record<string, ApolloClient<any>>;
}
export type Constructor<T> = new (...args: any[]) => T;

export type VueApolloModelMetadata<T extends BaseModel> = {
    type: 'apolloQuery';
    detail: ApolloQueryOptions<T>;
} | {
    type: 'apolloMutation';
    detail: ApolloMutationOptions<T>;
} | {
    type: 'restQuery';
    detail: RestQueryOptions<T>;
} | {
    type: 'restMutation';
    detail: RestMutationOptions<T>;
};