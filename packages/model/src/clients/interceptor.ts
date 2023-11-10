import type { RequestInfo, Response } from './types';

export type Interceptor<T, P> = {
    list: Array<{
        onResolve: (x: T) => any | null;
        onReject: (x: P) => any | null;
    }>;
    use:<Return>(onResolve: (x: T) => Return | Promise<Return>, onReject?: (x: P) => any)=> Interceptor<Return, P>;
}

export type CommonResponse = {
    status: Response['status'];
    statusText: Response['statusText'];
    headers: Response['headers'];
    config: RequestInfo;
    data: any;
}

export function createInterceptor<Params>(type: 'request'): Interceptor<Params, any>;
export function createInterceptor<Params>(type: 'response'): Interceptor<Params, any>;
export function createInterceptor(type: any) {
    const list: Array<any>  = [];
    function use(onResolve: (...params: any) => any, onReject?: (...params: any) => any) {
        list.push({
            onResolve,
            onReject,
        });
        return {
            use,
        };
    }

    return {
        list,
        use,
    };
}
