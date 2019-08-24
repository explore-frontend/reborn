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
import { DeepPartial } from 'utility-types';

import Store from './store';
import { BaseModel } from './model';
import { DocumentNode } from 'graphql';

export interface storeModelInstance<T> {
    constructor: T;
    instance: T | null;
    count: number;
}


declare module 'vue/types/options' {
    interface ComponentOptions<V extends Vue> {
        // TODO这个类型不对，后面改一下
        models?: any;
        store?: Store;
    }
}


declare module 'vue/types/vue' {
    interface Vue {
        $client: ApolloClient<any>;
        apollo: any;
        $store?: Store;
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
        models?: string[];
    }
}

export type BaseModelConstructor = typeof BaseModel

export interface ModelMap {
    [key: string]: {
        constructor: BaseModelConstructor;
        instance: BaseModel | Vue;
        count: number;
    };
}

// TODO貌似这个类型定义是不对的，后面看看any是否可被替换
export interface StreamsObj {
    [key: string]: Stream<any>;
}

interface JSONObj {
    [key: string]: any;
}

export type VariablesFn = (route: Route) => JSONObj
export type MutationVariablesFn = (params: any, route: Route) => JSONObj
export type BooleanFn = (route: Route) => boolean;
export type NumberFn = (route: Route) => number;

export interface VueApolloModelQueryOptions extends QueryOptions {
    client?: string;
    variables?: VariablesFn | JSONObj;
    prefetch?: BooleanFn | boolean;
    skip?: BooleanFn | boolean;
    pollInterval?: NumberFn | number;
    initState?: {
        [key: string]: any;
    };
}

export interface VueApolloModelMutationOptions {
    client?: string;
    mutation: DocumentNode;
    variables: MutationVariablesFn | JSONObj,
    initState?: {
        [key: string]: any;
    };
}

export interface QueryResult<T = any> {
    refetch(): Promise<void>;
    data: T;
    loading: boolean;
    fetchMore(options: VueApolloModelMutationOptions): Promise<void>;
}

export interface MutationResult<T, P> {
    loading: boolean;
    data: P;
    mutate(args0: T): void;
}

export interface GraphqlClients {
    defaultClient: ApolloClient<any>;
    clients: {
        [key: string]: ApolloClient<any>
    }
}