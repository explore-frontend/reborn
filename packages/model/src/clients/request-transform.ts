import type { HTTPHeaders, RequestInfo, RequestConfig, GQLQueryRequestConfig, GQLMutationRequestConfig, RestRequestConfig } from './types';

import { shimStringify, appendQueryStringToUrl } from '../utils';

function transformRequestBody<T extends Record<string, any>>(data: T, headers?: HTTPHeaders) {
    if (headers && headers['content-type'] === 'application/json') {
        return JSON.stringify(data);
    }

    if (headers && headers['content-type'] === 'application/x-www-form-urlencoded') {
        return shimStringify(data);
    }

    if (headers && headers['content-type'] === 'multipart/form-data') {
        // TODO这里如果在Node环境，需要polyfill实现
        const formData = new FormData();
        for (const name in data) {
            formData.append(name, data[name]);
        }
        return formData;
    }

    // FormData
    if (typeof FormData === 'function' && FormData && data instanceof FormData) {
        return data;
    }

    // URLSearchParams
    if (typeof URLSearchParams === 'function' && data instanceof URLSearchParams && headers) {
        headers['content-type'] = 'application/x-www-form-urlencoded';
        return data.toString();
    }

    // ArrayBuffer
    if (Object.prototype.toString.call(data) === '[object ArrayBuffer]') {
        return data as unknown as ArrayBuffer;
    }

    // File
    if (Object.prototype.toString.call(data) === '[object File]') {
        return data as unknown as File;
    }

    // Blob
    if (Object.prototype.toString.call(data) === '[object Blob]') {
        return data as unknown as Blob;
    }

    return JSON.stringify(data);
}

function generateCommonRequestInfo(params: RequestConfig) {
    const requestInit: RequestInit = {
        method: params.method,
        credentials: params.credentials,
        headers: params.headers,
        cache: 'no-store',
    };

    return requestInit;
}

function generateRestRequestInfo(params: RestRequestConfig): RequestInfo {
    let requestInit = generateCommonRequestInfo(params);
    const headers: HTTPHeaders = requestInit.headers as Record<string, any> || {};

    let { variables, url } = params;

    let body = variables
        ? transformRequestBody(variables, headers)
        : undefined;

    if (requestInit.method?.toLowerCase() === 'get' || requestInit.method?.toLowerCase() === 'head') {
        if (headers['content-type'] === 'application/x-www-form-urlencoded' && body) {
            url = appendQueryStringToUrl(url, body as string);
        }
        body = undefined;
    }

    // TODO这里在Node环境也一样需要FormData的polyfill实现
    if (typeof FormData === 'function' && body instanceof FormData) {
        // form-data的话header交由浏览器自己计算
        delete headers['content-type'];
    } else if (headers['content-type'] === 'application/x-www-form-urlencoded') {
        headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    }


    if (body) {
        requestInit.body = body;
    }

    return {
        url,
        requestInit,
    };
}

// TODO GQL的部分后面再补充，尤其是SSR的部分，待定先
function generateGQLRequestInfo(params: RequestConfig): RequestInfo {
    let {
        url,
        timeout,
        ...requestInit
    } = params;

    // requestInit.method = 'POST';
    // params.headers['content-type'] = 'application/json';
    // (requestInit as RequestInit).body = JSON.stringify(params.data);

    return {
        url: url || '',
        requestInit,
    };
}

export function generateRequestInfo(
    type: 'GQL' | 'REST',
    params: RequestConfig,
) {
    return type === 'GQL'
        ? generateGQLRequestInfo(params as GQLQueryRequestConfig | GQLMutationRequestConfig)
        : generateRestRequestInfo(params as RestRequestConfig);
}