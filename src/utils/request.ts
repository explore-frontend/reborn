import { shimStringify } from './qs';
import { Method, ContentType, Headers } from '../types';

export interface RequestParams {
    url: string;
    method: Method;
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
        const method = params.method || 'GET';
        const url = method === 'GET' && data
            ? `${uri}${params.url}?${shimStringify(data)}`
            : `${uri}${params.url}`;
        const headers: Headers = {
            ...defaultHeaders,
            ...params.headers,
        };
        const defaultRequestTransformer = requestTransformerMap[headers['content-type']!];
        let body;
        if (method.toUpperCase() === 'GET') {
            body === undefined;
        } else if (requestTransformer) {
            body = requestTransformer(data);
        } else {
            body = defaultRequestTransformer(data);
        }
        return fetch(url, {
            method,
            credentials: 'include',
            mode: params.mode || 'cors',
            headers,
            body,
        })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(responseTransformer);
    }
}