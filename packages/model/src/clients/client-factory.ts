import type { generateRequestInfo } from './request-transform';
import type { CommonResponse } from './interceptor';
import type { ClientOptions, Params, FetchPolicy, RequestConfig, RestParams } from './types';
import type { HydrationStatus } from '../store';
import { ReplaySubject } from 'rxjs';
import { MODE } from '../const';

import { createCache } from '../cache';
import { hash } from '../cache/hash';
import { deepMerge } from '../utils';
import { createInterceptor } from './interceptor';


class _TimeoutError extends Error {
    override name =  'ModelTimeoutError'
    constructor(msg: string) {
        super(msg)
        this.message = msg;
    }
}

export class FetchError extends Error {
    override name =  'ModelFetchError'
    constructor(msg: string) {
        super(msg)
        this.message = msg;
    }
}

export const TimeoutError = (typeof DOMException !== 'undefined' ? DOMException: _TimeoutError) as typeof _TimeoutError

const DEFAULT_OPTIONS: ClientOptions = {
    method: 'GET',
    headers: {
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
        baseUrl,
    } = options;
    const url = baseUrl
        ? new URL(params.url || '/', baseUrl).href
        : params.url || '';

    const commonConfig = {
        timeout: params.timeout || timeout,
        headers: deepMerge({}, headers, params.headers),
        credentials,
        url: url || '',
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


export function clientFactory<ClientType extends 'GQL'| 'REST'>(
    type: ClientType,
    createRequestInfo: typeof generateRequestInfo,
    options?: ClientOptions,
) {
    const opts = options
        ? deepMerge({} as ClientOptions, DEFAULT_OPTIONS, options)
        : deepMerge({} as ClientOptions, DEFAULT_OPTIONS);
    const requestInterceptor = createInterceptor<ClientType extends 'GQL' ? Params : RestParams>('request');
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

        const config = mergeClientOptionsAndParams(opts, params) as ClientType extends 'GQL' ? Params : RestParams;

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

            if (!opts.fetch) {
                // 避免Node环境下的判断，所以没法简化写=。=，因为window.fetch会触发一次RHS导致报错
                if (MODE === 'SPA') {
                    // 小程序因为没有window，所以需要这里绕一下
                    if (typeof window !== 'undefined' && window.fetch) {
                        opts.fetch = (resource, options) => window.fetch(resource, options);
                    } else {
                        throw new Error('There is no useful "fetch" function');
                    }
                } else if (MODE === 'SSR') {
                    if (globalThis.fetch) {
                        opts.fetch = (resource, options) => globalThis.fetch(resource, options);
                    } else {
                        throw new Error('There is no useful "fetch" function');
                    }
                }
            }

            const {
                url,
                requestInit,
            } = request;
            const fetchPromise = opts.fetch!(url, requestInit).catch((e: Error) => new FetchError(e.message));

            const timeoutPromise = new Promise<InstanceType<typeof TimeoutError>>((resolve) => {
                setTimeout(
                    () => {
                        resolve(new TimeoutError('The request has been timeout'))
                    },
                    config.timeout,
                );
            });
            return Promise.race([timeoutPromise, fetchPromise]);
        }).then((res) => {
            // 浏览器断网情况下有可能会是null
            if (res === null) {
                res = new TimeoutError('The request has been timeout');
            }

            const list = [...responseInterceptor.list];

            // 用duck type绕过类型判断
            if (!('status' in res)) {
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

    function getDataFromCache<T>(params: Parameters<typeof request>[0]) {
        const data = cache.get<T>(`${hash(params.url)}-${hash(params.variables || {})}`);
        return data;
    }

    function setDataToCache<T>(params: Parameters<typeof request>[0], data: T) {
        const key = `${hash(params.url)}-${hash(params.variables || {})}`;
        cache.put(key, data);
    }

    function requestWithCache<T>(
        params: Parameters<typeof request>[0],
        fetchPolicy: FetchPolicy = 'network-first',
        hydrationStatus: HydrationStatus,
    ): ReplaySubject<T> {
        const subject = new ReplaySubject<T>();
        // 处于Hydration阶段，一律先从缓存里面拿
        if (hydrationStatus.value !== 2) {
            const data = getDataFromCache<T>(params);
            if (data) {
                subject.next(data);
                subject.complete();
                return subject;
            }
        }
        const data = getDataFromCache<T>(params);
        switch (fetchPolicy) {
            case 'cache-and-network':
                if (data) {
                    subject.next(data);
                }
                request<T>(params).then(data => {
                    // TODO还差分发network status出去
                    setDataToCache(params, data);
                    subject.next(data);
                    subject.complete();
                }).catch(e => {
                    subject.error(e);
                    subject.complete();
                });
                break;
            case 'cache-first':
                if (data) {
                    subject.next(data);
                } else {
                    request<T>(params).then(data => {
                        // TODO还差分发network status出去
                        setDataToCache(params, data);
                        subject.next(data);
                        subject.complete();
                    }).catch(e => subject.error(e));
                }
                break;
            case 'network-first':
                request<T>(params).then(data => {
                    setDataToCache(params, data);
                    subject.next(data);
                    subject.complete();
                }).catch(e => {
                    subject.error(e);
                    subject.complete();
                });
                break;
            case 'cache-only':
                if (data) {
                    subject.next(data);
                    subject.complete();
                } else {
                    subject.error('No data in cache');
                    subject.complete();
                }
                break;
            case 'network-only':
                request<T>(params)
                    .then(data => {
                        subject.next(data);
                        subject.complete();
                    })
                    .catch(e => {
                        subject.complete();
                        subject.error(e);
                    });
            default:
                throw new Error(`There is a wrong fetchPolicy: ${fetchPolicy}`);
        }

        return subject;
    }

    return {
        interceptors,
        query: requestWithCache,
        mutate: request,
        type
    };
}
