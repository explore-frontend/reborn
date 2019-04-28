/**
 * @file 类型声明
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 29, 2018
 */

import Vue from 'vue';
import {Route} from 'vue-router';
import {Stream} from 'xstream';
import {ApolloClient, QueryOptions} from 'apollo-client';

import Store from './store';
import {BaseModel} from './model';

export type apolloClient = ApolloClient<any>;

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
        $apollo: object;
        $client: apolloClient;
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
export type BooleanFn = (route: Route) => boolean;

export interface VueApolloModelQueryOptions extends QueryOptions {
    variables?: VariablesFn | JSONObj;
    prefetch?: BooleanFn | boolean;
    skip?: BooleanFn | boolean;
    initState?: {
        [key: string]: any;
    };
}
