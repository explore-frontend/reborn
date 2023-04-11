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
type QueryClientParams = {
    url?: string;
    query: DocumentNode;
    variables?: Record<string, unknown>;
}

type MutationClientParams = {
    url?: string;
    mutation: DocumentNode;
    variables?: Record<string, unknown>;
}

export type GQLParams = QueryClientParams | MutationClientParams;

export type RestParams = {
    url: string;
    headers?: HTTPHeaders;
    method?: Method;
    variables?: Record<string, unknown>;
    timeout?: number;
}