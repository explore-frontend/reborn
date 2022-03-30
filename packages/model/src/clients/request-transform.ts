import type { HTTPHeaders, Method, ClientOptions } from './common';
import type { RestClientParams, GQLClientParams } from '../operations/types';

import { deepMerge, shimStringify } from '../utils';

function transformRequestBody<T extends Record<string, any>>(data: T, headers?: HTTPHeaders) {
    // FormData
    if (data instanceof FormData) {
        return data;
    }

    // ArrayBuffer
    if (Object.toString.call(data) === '[object ArrayBuffer]') {
        return data as unknown as ArrayBuffer;
    }

    // File
    if (Object.toString.call(data) === '[object File]') {
        return data as unknown as File;
    }

    // Blob
    if (Object.toString.call(data) === '[object Blob]') {
        return data as unknown as Blob;
    }

    if (data instanceof URLSearchParams && headers) {
        headers['content-type'] = 'application/x-www-form-urlencoded';
        return data.toString();
    }

    if (headers && headers['content-type'] === 'application/json') {
        return JSON.stringify(data);
    }

    if (headers && headers['content-type'] === 'multipart/form-data') {
        const formData = new FormData();
        for (const name in data) {
            formData.append(name, data[name]);
        }
        return formData;
    }

    if (headers && headers['content-type'] === 'application/x-www-form-urlencoded') {
        return shimStringify(data);
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

    const requestInit: RequestInit = deepMerge(originalRequestInit, targetRequestInit);
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

    if (params.method === 'GET') {
        if (headers['content-type'] === 'application/x-www-form-urlencoded') {
            url = url.indexOf('?') ? `${url}&${body}` : `${url}?${body}`;
        }
        body = undefined;
    }

    if (body instanceof FormData) {
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
    type: 'gql' | 'rest',
    clientOptions: ClientOptions,
    params: GQLClientParams | RestClientParams,
) {
    return type === 'gql'
        ? generateRestRequestInfo(clientOptions, params as RestClientParams)
        : generateGQLRequestInfo(clientOptions, params as GQLClientParams)
}