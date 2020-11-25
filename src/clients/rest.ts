import { Method, ContentType, Headers } from '../types';

function stringifyPrimitive(v: string | boolean | number) {
    switch (typeof v) {
        case 'string':
            return v;
        case 'boolean':
            return v ? 'true' : 'false';
        case 'number':
            return isFinite(v) ? v : '';
        default:
            return '';
    }
};
function encode(v: string | boolean | number) {
    return encodeURIComponent(stringifyPrimitive(v));
}
// 简单做下key的排序是为了做缓存key那里，临时性解决，后面可能做细粒度优化
function shimStringify(obj: any) {
    if (obj === null) {
        obj = undefined;
    }
    if (typeof obj !== 'object') {
        throw new Error('Params stringify Error, only support object');
    }
    return Object.keys(obj).map(k => {
        const key = encode(k) + '=';
        if (Array.isArray(obj[k])) {
          return obj[k].map((v: any) => {
            return key + encode(v);
          }).join('&');
        }
        return key + encode(obj[k]);
    }).join('&');
}

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
    responsePreHandler?: (data: Response) => any;
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

export function createRestClient({
    uri = '',
    headers,
    responseTransformer,
    requestTransformer,
    responsePreHandler,
}: RestOptions = {}) {
    const defaultHeaders: Headers = {
        'content-type': 'application/json',
        ...headers,
    };
    return function request(params: RequestParams) {
        const data = params.data;
        const method = params.method.toUpperCase() || 'GET';
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
            credentials: 'include',
            mode: params.mode || 'cors',
            headers,
            body,
        })
        .then(res => {
            if (responsePreHandler) {
                responsePreHandler(res.clone())
            }
            return res;
        })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(responseTransformer);
    }
}
