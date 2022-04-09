import type { HTTPHeaders, ClientOptions } from './common';
import type { RestClientParams, GQLClientParams } from '../operations/types';

import { deepMerge, shimStringify, appendQueryStringToUrl } from '../utils';

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

    // URLSerchParams
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

function generateCommonRequestInfo(
    clientOptions: ClientOptions,
    params: RestClientParams,
) {
    let {
        url,
        timeout: originalTimeout,
        fetch,
        ...originalRequestInit
    } = clientOptions;

    const {
        url: targetUrl,
        timeout: targetTimeout,
        ...targetRequestInit
    } = params;

    const requestInit: RequestInit = deepMerge({}, originalRequestInit, targetRequestInit);
    const timeout = (targetTimeout || originalTimeout);

    url = targetUrl || url || '';

    return {
        url,
        timeout: timeout && timeout >= 0 ? timeout : 60 * 1000,
        requestInit,
    };
}

type RequestInfo = {
    url: string;
    timeout: number;
    requestInit: RequestInit;
}

function generateRestRequestInfo(
    clientOptions: ClientOptions,
    params: RestClientParams,
): RequestInfo {
    let { url, timeout, requestInit } = generateCommonRequestInfo(clientOptions, params);
    const headers: HTTPHeaders = requestInit.headers as Record<string, any> || {};

    const { variables } = params;

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
        timeout,
        requestInit,
    };
}

// TODO GQL的部分后面再补充，尤其是SSR的部分，待定先
function generateGQLRequestInfo(
    clientOptions: ClientOptions,
    params: GQLClientParams,
): RequestInfo {
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
        timeout: timeout || 60 * 1000,
        requestInit,
    };
}

export function generateRequestInfo(
    type: 'GQL' | 'REST',
    clientOptions: ClientOptions,
    params: GQLClientParams | RestClientParams,
) {
    return type === 'GQL'
        ? generateGQLRequestInfo(clientOptions, params as GQLClientParams)
        : generateRestRequestInfo(clientOptions, params as RestClientParams);
}