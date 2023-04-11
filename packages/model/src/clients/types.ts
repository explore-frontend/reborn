import type { DocumentNode } from 'graphql';

import type { createClient } from './index';
import type { createCache } from '../cache';

export type RequestInfo = {
    url: string;
    requestInit: RequestInit;
}

export type Client = ReturnType<typeof createClient>;

export type RebornClient = {
    gql?: Client,
    rest?: Client,
};

type MethodType<T extends string> = Lowercase<T> | Uppercase<T>;

export type Method = MethodType<
    'get'
    | 'post'
    | 'delete'
    | 'put'
    | 'patch'
    | 'options'
    | 'head'
    | 'trace'
    | 'connect'
>

type ContentType = 'application/json'
    | 'multipart/form-data'
    | 'application/x-www-form-urlencoded'
    | 'application/x-www-form-urlencoded;charset=UTF-8';

export type HTTPHeaders = {
    'content-type'?: ContentType;
} & Record<string, string>;

export type ClientOptions = {
    url?: string;
    method?: Method;
    credentials?: RequestCredentials;
    headers?: HTTPHeaders;
    timeout?: number;
    fetch?: typeof fetch;
    cache?: ReturnType<typeof createCache>;
};


// 交给Client请求用的部分
export type GQLQueryParams = {
    url?: string;
    query: DocumentNode;

    headers?: HTTPHeaders;
    variables?: Record<string, unknown>;
    timeout?: number;
    fetchPolicy?: FetchPolicy;
}

export type GQLMutationParams = {
    url?: string;
    mutation: DocumentNode;

    headers?: HTTPHeaders;
    variables?: Record<string, unknown>;
    timeout?: number;
}

export type RestParams = {
    url: string;
    method?: Method;

    headers?: HTTPHeaders;
    variables?: Record<string, unknown>;
    timeout?: number;
    fetchPolicy?: FetchPolicy;
}

export type FetchPolicy = 'cache-and-network'
    | 'cache-first'
    | 'network-first'
    | 'network-only'
    | 'cache-only';

export type GQLQueryRequestConfig = GQLQueryParams & Omit<ClientOptions, 'fetch' | 'cache'>;
export type GQLMutationRequestConfig = GQLMutationParams & Omit<ClientOptions, 'fetch' | 'cache'>;

export type RestRequestConfig = RestParams & Omit<ClientOptions, 'fetch' | 'cache'>;

export type RequestConfig = GQLQueryRequestConfig | GQLMutationRequestConfig | RestRequestConfig;

export type Params = RestParams | GQLMutationParams | GQLQueryParams;