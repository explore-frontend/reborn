import { shimStringify } from './qs';

export interface RequestParams {
    url: string;
    method: 'get' | 'post' | 'delete' | 'put';
    data?: Record<string, any>;
    headers?: {
        contentType?: 'applicaton/json' | 'multipart/form-data';
    }
}
export interface RestOptions {
    uri?: string;
    headers?: any;
    responseTransformer?: (data: any) => any;
}

export function createRequest({
    uri = '',
    headers,
    responseTransformer
}: RestOptions = {}) {
    const defaultHeaders = Object.assign({
        contentType: 'applicaton/json'
    }, headers);
    return function request(params: RequestParams) {
        const data = params.data ?? {};
        const method = params.method || 'get';
        const url = method === 'get'
            ? `${uri}${params.url}?${shimStringify(data)}`
            : `${uri}${params.url}`;
        return fetch(url, {
            method,
            credentials: 'include',
            headers: Object.assign({}, defaultHeaders, params.headers),
            body: method !== 'get'
                ? JSON.stringify(data)
                : undefined
        }).then(res => res.json())
        .then(responseTransformer, responseTransformer);
    }
}