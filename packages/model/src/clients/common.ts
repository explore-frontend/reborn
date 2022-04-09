import type { RestClientParams, GQLClientParams, CommonClientParams } from '../operations/types';
import type { generateRequestInfo } from './request-transform';

import { deepMerge } from '../utils';

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

type TransformRequest = (params: RestClientParams | GQLClientParams) => any;

type TransformResponse = (result: CommonResponse | Record<string, any>) => any | Promise<any>;

type TransformReject = (params: any) => any;

export type ClientOptions = {
    url?: string;
    method: Method;
    fetch?: typeof fetch,
} & CommonClientParams;

const DEFAULT_OPTIONS: ClientOptions = {
    method: 'GET',
    headers: {
        'content-type': 'application/json',
    },
    timeout: 60 * 1000,
    credentials: 'include',
};

type Interceptor<T, P> = {
    list: Array<{
        onResolve: T | undefined;
        onReject: P | undefined;
    }>;
    use(onResolve: T, onReject?: P): void;
};


function createInterceptor(type: 'request'): Interceptor<TransformRequest, TransformReject>;
function createInterceptor(type: 'response'):  Interceptor<TransformResponse, TransformReject>;
function createInterceptor(type: any) {
    const list: Array<any>  = [];
    function use(onResolve: (...params: any) => any, onReject?: (...params: any) => any) {
        list.push({
            onResolve,
            onReject,
        });
    }

    return {
        list,
        use,
    };
}

export type RequestInfo = {
    url: string;
    timeout: number;
    requestInit: RequestInit;
}

type CommonResponse = {
    status: Response['status'];
    statusText: Response['statusText'];
    headers: Response['headers'];
    config: RequestInfo;
    data: any;
}

export function clientFactory(
    type: 'GQL' | 'REST',
    createRequestInfo: typeof generateRequestInfo,
    options?: ClientOptions,
) {
    const opts = options
        ? deepMerge({} as ClientOptions, DEFAULT_OPTIONS, options)
        : deepMerge({} as ClientOptions, DEFAULT_OPTIONS);
    if (!opts.fetch) {
        if (typeof typeof window !== 'undefined' && window.fetch) {
            opts.fetch = window.fetch.bind(window);
        } else if (typeof typeof global !== 'undefined' && global.fetch) {
            opts.fetch = global.fetch.bind(global);
        } else {
            throw new Error('create client need a fetch function to init');
        }
    }
    const requestInterceptor = createInterceptor('request');
    const responseInterceptor = createInterceptor('response');

    const interceptors = {
        request: {
            use: requestInterceptor.use,
        },
        response: {
            use: responseInterceptor.use,
        },
    };

    function request<T>(params: RestClientParams | GQLClientParams): Promise<T> {
        // 处理前置拦截器

        const list = [...requestInterceptor.list];
        while (list.length) {
            const item = list.shift();
            try {
                item?.onResolve?.(params);
            } catch (e) {
                item?.onReject?.(e);
                break;
            }
        }

        const config = createRequestInfo(type, opts, params);

        const {
            url,
            timeout,
            requestInit,
        } = config;

        const fetchPromise = opts.fetch!(url, requestInit);

        const timeoutPromise = new Promise<DOMException>((resolve) => {
            setTimeout(
                () => resolve(new DOMException('The request has been timeout')),
                timeout,
            );
        });

        return Promise
            .race([timeoutPromise, fetchPromise])
            .then(res => {
                if (res instanceof DOMException) {
                    return Promise.reject(res);
                }
                // 浏览器断网情况下有可能会是null
                if (res === null) {
                    return Promise.reject(new DOMException('The request has been timeout'));
                }
                const receiveType = res.headers.get('Content-Type')
                    || (config.requestInit.headers as Record<string, string>)?.['Content-Type']
                    || (config.requestInit.headers as Record<string, string>)?.['content-type']
                    || 'application/json';

                const commonInfo: CommonResponse = {
                    status: res.status,
                    statusText: res.statusText,
                    headers: res.headers,
                    config,
                    data: undefined,
                };

                let promise;
                if (receiveType.indexOf('application/json') !== -1) {
                    promise = res.ok
                        ? res.json().then(data => {
                            commonInfo.data = data;
                            return commonInfo;
                        })
                        : Promise.reject(res)
                } else {
                    commonInfo.data = res.body;
                    // 其它类型就把body先扔回去……也许以后有用……
                    promise = res.ok ? Promise.resolve(commonInfo) : Promise.reject(res)
                }
                const list = [...responseInterceptor.list];
                while (list.length) {
                    const transform = list.shift();
                    promise = promise.then(transform?.onResolve, transform?.onReject);
                }

                return promise;
            });
    }

    return {
        interceptors,
        request,
    };
}
