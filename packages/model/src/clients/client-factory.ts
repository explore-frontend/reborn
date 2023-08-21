import type { FetchPolicy } from './types';
import type { HydrationStatus } from '../store';
import { ReplaySubject } from 'rxjs';
import { MODE } from '../const';

import { createCache, hash } from '../cache';

import { createInterceptor } from './interceptor';
import { type CommonExtraParams } from '..';

export type CustomClient<Params, Response, Variables extends Record<string, any>, ExtraParams extends CommonExtraParams> = {
    transformRequestParams(variables: Variables, extraParams: ExtraParams, mode: typeof MODE): Params
    hashVariables?(variables: Variables, hash: (v: any) => string): string
    request(params: Params, mode: typeof MODE): Promise<Response>
}

export function createCustomClient<Params, Response, Variables extends Record<string, any>, ExtraParams extends CommonExtraParams>(type: string, client: CustomClient<Params, Response, Variables, ExtraParams>, options: {
    cache?: ReturnType<typeof createCache>
}) {
    const requestInterceptor = createInterceptor<Params>('request');
    const responseInterceptor = createInterceptor<Response>('response');

    const interceptors = {
        request: {
            use: requestInterceptor.use,
        },
        response: {
            use: responseInterceptor.use,
        },
    };

    function request<T>(variables: Variables, extraParams: ExtraParams): Promise<T> {
        // 处理前置拦截器

        const list = [...requestInterceptor.list];

        const params = client.transformRequestParams(variables, extraParams, MODE)

        // 后面再做benchmark看看一个tick会差出来多少性能
        let promise = Promise.resolve(params);

        while (list.length) {
            const item = list.shift();
            promise = promise.then(item?.onResolve, item?.onReject);
        }

        return promise.then(params => {
            let promise = client.request!(params, MODE);
            const list = [...responseInterceptor.list];
            while (list.length) {
                const transform = list.shift();
                promise = promise.then(transform?.onResolve, transform?.onReject);
            }
            return promise as any;
        })
    }

    const cache = options?.cache || createCache();

    function getDataFromCache<T>(variables: Parameters<typeof request>[0]) {
        const key = (client.hashVariables ?? hash)(variables, hash)
        const data = cache.get<T>(key);
        return data;
    }

    function setDataToCache<T>(variables: Parameters<typeof request>[0], data: T) {
        const key = (client.hashVariables ?? hash)(variables, hash)
        cache.put(key, data);
    }

    function requestWithCache<T>(
        variables: Parameters<typeof request>[0],
        extraParams: Parameters<typeof request>[1],
        fetchPolicy: FetchPolicy = 'network-first',
        hydrationStatus: HydrationStatus,
    ): ReplaySubject<T> {
        const subject = new ReplaySubject<T>();
        // 处于Hydration阶段，一律先从缓存里面拿
        if (hydrationStatus.value !== 2) {
            const data = getDataFromCache<T>(variables);
            if (data) {
                subject.next(data);
                subject.complete();
                return subject;
            }
        }
        const data = getDataFromCache<T>(variables);
        switch (fetchPolicy) {
            case 'cache-and-network':
                if (data) {
                    subject.next(data);
                }
                request<T>(variables, extraParams).then(data => {
                    // TODO还差分发network status出去
                    setDataToCache(variables, data);
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
                    request<T>(variables, extraParams).then(data => {
                        // TODO还差分发network status出去
                        setDataToCache(variables, data);
                        subject.next(data);
                        subject.complete();
                    }).catch(e => subject.error(e));
                }
                break;
            case 'network-first':
                request<T>(variables, extraParams).then(data => {
                    setDataToCache(variables, data);
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
                request<T>(variables, extraParams)
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
    }

}
