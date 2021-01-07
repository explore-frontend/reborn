import { shimStringify } from './qs';
import { Method, ContentType, Credentials, Headers } from '../types';

export interface RequestParams {
    url: string;
    method: Method;
    credentials?: Credentials;
    mode?: 'no-cors' | 'cors' | 'same-origin';
    data?: Record<string, any>;
    headers?: Headers;
    query?: Record<string, any>
}
export interface RestOptions {
    uri?: string;
    headers?: Headers;
    requestTransformer?: (data: any) => any;
    responseTransformer?: (data: any) => any;
}

const requestTransformerMap: Record<ContentType, (data: any) => string | FormData> = {
    'application/json': data => JSON.stringify(data),
    'multipart/form-data': data => {
        const formData = new FormData();
        for (const name in data) {
            formData.append(name, data[name]);
        }
        return formData;
    },
    'application/x-www-form-urlencoded': data => shimStringify(data)
}

export function createRequest({
    uri = '',
    headers,
    responseTransformer,
    requestTransformer,
}: RestOptions = {}) {
    const defaultHeaders: Headers = {
        'content-type': 'application/json',
        ...headers,
    };
    return function request(params: RequestParams) {
        const data = params.data;
        const method = params.method.toUpperCase() || 'GET';
        const credentials = params.credentials || 'include';
        const url = method === 'GET' && data
            ? `${uri}${params.url}?${shimStringify(data)}`
            : `${uri}${params.url}`;
        const headers: Record<string, any> = {
            ...defaultHeaders,
            ...params.headers,
        };
        const defaultRequestTransformer = requestTransformerMap[headers['content-type'] as Headers['content-type'] || 'application/json'];
        let body: string | FormData | undefined;
        if (method === 'GET') {
            body === undefined;
        } else if (requestTransformer) {
            body = requestTransformer(data);
        } else {
            body = defaultRequestTransformer(data);
        }
        if (body instanceof FormData) {
            // form-data的话header交由浏览器自己计算
            delete headers['content-type'];
        } else if (headers['content-type'] === 'application/x-www-form-urlencoded') {
            headers['content-type'] = headers['content-type'] + ';charset=UTF-8';
        }
        return fetch(url, {
            method,
            credentials,
            mode: params.mode || 'cors',
            headers,
            body,
        })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(responseTransformer);
    }
}
