import type { generateRequestInfo } from './request-transform';
import type { CommonResponse } from './interceptor';
import type { ClientOptions, Params, FetchPolicy, RequestConfig } from './types';

import { createCache } from '../cache';

import { deepMerge } from '../utils';
import { createInterceptor } from './interceptor';


const DEFAULT_OPTIONS: ClientOptions = {
    method: 'GET',
    headers: {
        'content-type': 'application/json',
    },
    timeout: 60 * 1000,
    credentials: 'include',
};

// TODO后续再优化下逻辑写法，比如对于method的定义，需要定义好client与options的边界，拆分通用merge和转换成requestInit的部分……
function mergeClientOptionsAndParams(options: ClientOptions, params: Params): RequestConfig {
    const {
        timeout,
        headers,
        method,
        credentials,
        url,
    } = options;

    const commonConfig = {
        timeout: params.timeout || timeout,
        headers: deepMerge({}, headers, params.headers),
        credentials,
        url: params.url || url || '',
        variables: params.variables,
    };

    if ('method' in params) {
        return {
            ...commonConfig,
            method: params.method || method,
            fetchPolicy: params.fetchPolicy,
        };
    }

    if ('query' in params) {
        return {
            ...commonConfig,
            query: params.query,
            fetchPolicy: params.fetchPolicy,
        };
    }

    if ('mutation' in params) {
        return {
            ...commonConfig,
            mutation: params.mutation,
        }
    }

    return commonConfig;
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
        // 避免Node环境下的判断，所以没法简化写=。=
        if (typeof window !== 'undefined') {
            if (window.fetch) {
                opts.fetch = window.fetch.bind(window);
            } else {
                throw new Error('create client need a fetch function to init');
            }
        } else if (typeof global !== 'undefined') {
            if (global.fetch) {
                opts.fetch = global.fetch.bind(global);
            } else {
                throw new Error('create client need a fetch function to init');
            }
        }
    }
    const requestInterceptor = createInterceptor<Params>('request');
    const responseInterceptor = createInterceptor<CommonResponse>('response');

    const interceptors = {
        request: {
            use: requestInterceptor.use,
        },
        response: {
            use: responseInterceptor.use,
        },
    };

    function request<T>(params: Params): Promise<T> {
        // 处理前置拦截器

        const list = [...requestInterceptor.list];

        const config = mergeClientOptionsAndParams(opts, params);

        // 后面再做benchmark看看一个tick会差出来多少性能
        let promise = Promise.resolve(config);

        while (list.length) {
            const item = list.shift();
            promise = promise.then(item?.onResolve, item?.onReject);
        }

        let request: ReturnType<typeof createRequestInfo>;

        return promise.then(params => {
            // TODO这里的
            request = createRequestInfo(type, params);

            const {
                url,
                requestInit,
            } = request;

            const fetchPromise = opts.fetch!(url, requestInit);

            const timeoutPromise = new Promise<DOMException>((resolve) => {
                setTimeout(
                    () => resolve(new DOMException('The request has been timeout')),
                    config.timeout,
                );
            });
            return Promise.race([timeoutPromise, fetchPromise]);
        }).then((res) => {
            // 浏览器断网情况下有可能会是null
            if (res === null) {
                res = new DOMException('The request has been timeout');
            }

            const list = [...responseInterceptor.list];

            if (res instanceof DOMException) {
                let promise: Promise<any> = Promise.reject({
                    res,
                    request,
                });
                while (list.length) {
                    const transform = list.shift();
                    promise = promise.then(transform?.onResolve, transform?.onReject);
                }
                return promise;
            }

            const receiveType = res.headers.get('Content-Type')
                || (request.requestInit.headers as Record<string, string>)?.['Content-Type']
                || (request.requestInit.headers as Record<string, string>)?.['content-type']
                || 'application/json';

            const commonInfo: CommonResponse = {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
                config: request,
                data: undefined,
            };

            let promise;
            if (receiveType.indexOf('application/json') !== -1) {
                promise = res.ok
                    ? res.json().then(data => {
                        commonInfo.data = data;
                        return commonInfo;
                    })
                    : Promise.reject({
                        res,
                        request,
                    })
            } else {
                commonInfo.data = res.body;
                // 其它类型就把body先扔回去……也许以后有用……
                promise = res.ok ? Promise.resolve(commonInfo) : Promise.reject({
                    res,
                    request,
                });
            }
            while (list.length) {
                const transform = list.shift();
                promise = promise.then(transform?.onResolve, transform?.onReject);
            }

            return promise;
        });
    }

    const cache = options?.cache || createCache();

    // TODO还差第一次请求，也就是SSR的标记该如何消费
    function requestWithCache<T>(params: Parameters<typeof request>[0], fetchPolicy: FetchPolicy = 'cache-and-network'): ReturnType<typeof request<T>> {
        switch (fetchPolicy) {
            case 'cache-and-network':
                return request(params);
            case 'cache-first':
                return request(params);
            case 'network-first':
                return request(params);
            case 'cache-only':
                return request(params);
            case 'network-only':
                return request(params);
            default:
                throw new Error(`There is a wrong fetchPolicy: ${fetchPolicy}`);
        }
    }

    return {
        interceptors,
        request: requestWithCache,
    };
}
