import { generateRequestInfo } from './request-transform';
import type { CommonResponse } from './interceptor';
import type { ClientOptions, Params, FetchPolicy, RequestConfig, RestParams, Method, HTTPHeaders } from './types';
import { MODE } from '../const';

import { deepMerge } from '../utils';
import { type CustomClient, createCustomClient } from './client-factory';
import { type CommonExtraParams, createCache } from '..';


const DEFAULT_OPTIONS: ClientOptions = {
    method: 'GET',
    headers: {
        'content-type': 'application/json',
    },
    timeout: 60 * 1000,
    credentials: 'include',
};

// TODO后续再优化下逻辑写法，比如对于method的定义，需要定义好client与options的边界，拆分通用merge和转换成requestInit的部分……
function mergeClientOptionsAndParams(options: ClientOptions, params: Partial<RestParams>): RestParams {
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

    return commonConfig;
}

export type RestVariables =  {
    url: string,
    variables?: Record<string, any>
}

export type RestExtraOptions = CommonExtraParams & {
    method?: Method
}

export type RestResponse = CommonResponse
export type RestClient = CustomClient<RestParams, RestResponse, RestVariables, RestExtraOptions>

export type RestClientOptions = {
    baseUrl?: string;
    method?: Method;
    credentials?: RequestCredentials;
    headers?: HTTPHeaders;
    timeout?: number;
    fetch?: typeof fetch;
    cache?: ReturnType<typeof createCache>;
};

class TimeoutError extends Error {
    constructor(msg: string) {
        super(msg)
        this.message = msg;
    }
}

export function createRestClient(options?: RestClientOptions) {
    const opts = options
        ? deepMerge({} as ClientOptions, DEFAULT_OPTIONS, options)
        : deepMerge({} as ClientOptions, DEFAULT_OPTIONS);

    const request: RestClient['request'] = (params, mode) => {
        const request = generateRequestInfo('REST', params)
        if (!opts.fetch) {
            // 避免Node环境下的判断，所以没法简化写=。=，因为window.fetch会触发一次RHS导致报错
            if (mode === 'SPA') {
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
        const fetchPromise = opts.fetch!(url, requestInit);

        const timeoutPromise = new Promise<DOMException | TimeoutError>((resolve) => {
            setTimeout(
                () => {
                    if (MODE === 'SSR') {
                        resolve(new TimeoutError('The request has been timeout'))
                    } else {
                        resolve(new DOMException('The request has been timeout'))
                    }
                },
                params.timeout,
            );
        });
        return Promise.race([timeoutPromise, fetchPromise]).then((res) => {
            // 浏览器断网情况下有可能会是null
            if (res === null) {
                res = MODE === 'SSR'
                    ? new TimeoutError('The request has been timeout')
                    : new DOMException('The request has been timeout');
            }

            // 用duck type绕过类型判断
            if (!('status' in res)) {
                return Promise.reject({
                    res,
                    request,
                });
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

            return promise;
        });

    }

    const transformRequestParams: RestClient['transformRequestParams'] = (variables, extraOptions, mode) => {
        const params: Partial<RestParams> = {
            ...extraOptions,
            url: variables.url,
            variables: variables.variables
        }
        return mergeClientOptionsAndParams(opts, params);
    }

    const hash: RestClient['hashVariables'] = (variables, hash) => {
        return `${hash(variables.url)}-${hash(variables.variables || {})}`

    }

    const client: CustomClient<any, any, any, any> = {
        transformRequestParams,
        hashVariables: hash,
        request
    }

    return createCustomClient('REST', client, {
        cache: opts.cache!,
    })
}
