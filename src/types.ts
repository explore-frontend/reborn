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

export interface storeModelInstance<T> {
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

export interface ModelMap<T extends typeof BaseModel> {
    [key: string]: {
        constructor: T;
        instance: BaseModel | Vue;
        count: number;
    };
}

// TODO貌似这个类型定义是不对的，后面看看any是否可被替换
export type StreamsObj = Record<string, Stream<any>>;

export type VariablesFn<T> = (this: T, route: Route) => Record<string, any>
export type MutationVariablesFn<T> = (this: T, params: any, route: Route) => Record<string, any>
export type BooleanFn = (route: Route) => boolean;
export type NumberFn = (route: Route) => number;

export interface VueApolloModelQueryOptions<T> extends QueryOptions {
    client?: string;
    variables?: VariablesFn<T> | Record<string, any>;
    prefetch?: BooleanFn | boolean;
    skip?: BooleanFn | boolean;
    pollInterval?: NumberFn | number;
    initState?: {
        [key: string]: any;
    };
}

export interface VueApolloModelMutationOptions<T> {
    client?: string;
    mutation: DocumentNode;
    variables: MutationVariablesFn<T> | Record<string, any>,
    initState?: {
        [key: string]: any;
    };
}

export interface QueryResult<T = any, P = any> {
    refetch(): Promise<void>;
    data: T;
    loading: boolean;
    fetchMore(options: VueApolloModelQueryOptions<P>): Promise<void>;
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
    clients: {
        [key: string]: ApolloClient<any>
    }
}
export type Constructor<T> = new (...args: any[]) => T;
