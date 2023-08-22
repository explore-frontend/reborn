import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { Observable, Subject, type Subscription } from 'rxjs';

import type { RestQueryOptions, RestFetchMoreOption } from './types';
import type { Client, RestRequestConfig } from '../clients';
import type { HydrationStatus, Store } from '../store';

import { generateQueryOptions } from './core';
import { computed, ref, type Ref } from 'vue';
import { deepMerge } from '../utils';
import { type InfoDataType, RequestReason, StateStatus, getStatus } from './status';

export function createRestQuery<ModelType, DataType>(
    option: RestQueryOptions<ModelType, DataType>,
    model: ModelType,
    route: RouteLocationNormalizedLoaded,
    hydrationStatus: HydrationStatus,
    client?: Client,
) {
    if (!client) {
        throw new Error('No Rest Client has been set');
    }
    const { info, skip, variables, fetchQuery$, prefetch } = generateQueryOptions<ModelType, DataType>(
        option,
        route,
        model,
    );

    const url = computed(() => {
        if (typeof option.url === 'function') {
            return option.url.call(model, route, variables.value);
        }
        return option.url;
    });


    function fetch() {
        return new Promise((resolve) => {
            // 这里记录一下请求开始时的 info 信息，避免并发请求 status 错乱
            const singleInfo = {
                ...info
            }
            const id = ++requestId
            const reason = requestReason.value
            singleInfo.loading = info.loading = true;
            const clientParams = {
                url: url.value,
                headers: option.headers,
                method: option.method,
                fetchPolicy: option.fetchPolicy,
                variables: variables.value,
                timeout: option.timeout,
            };

            stream$.next({
                id,
                url: clientParams.url,
                variables: clientParams.variables,
                requestReason: requestReason.value,
                status: getStatus(singleInfo, reason),
                data: undefined,
                loading: true,
                error: undefined,
            })
            // TODO后面再重写一下
            const subject = client!.query<DataType>(clientParams, option.fetchPolicy, hydrationStatus);
            subject.subscribe({
                next: (data) => {
                    singleInfo.error = info.error = undefined;
                    if (data) {
                        singleInfo.data = info.data = data;
                    }
                    singleInfo.loading = info.loading = false;

                    stream$.next({
                        id,
                        url: clientParams.url,
                        variables: clientParams.variables,
                        requestReason: requestReason.value,
                        status: getStatus(singleInfo, reason),
                        data: info.data,
                        loading: false,
                        error: undefined,
                    })

                    resolve(undefined);
                },
                error: (e) => {
                    singleInfo.error = info.error = e;
                    singleInfo.loading = info.loading = false;

                    stream$.next({
                        id,
                        url: clientParams.url,
                        variables: clientParams.variables,
                        requestReason: requestReason.value,
                        status: getStatus(singleInfo, reason),
                        data: undefined,
                        loading: false,
                        error: info.error,
                    })

                    resolve(undefined);
                },
                complete: () => {
                    // TODO先临时搞一下，后面再看怎么串一下Observable
                    subject.unsubscribe();
                },
            });
        });
    }

    let sub: Subscription | null = null;
    let requestId = 0
    const stream$ = new Subject<InfoDataType<DataType> & {
        id: number
        url: string
        variables?: Record<string, unknown>
        requestReason: RequestReason
        status: StateStatus,
    }>()
    const requestReason = ref<RequestReason>(RequestReason.setVariables);
    function init() {
        sub = fetchQuery$.subscribe((reason) => {
            if (skip.value) {
                return;
            }
            requestReason.value = reason;
            fetch();
        });
    }

    function destroy() {
        if (sub) {
            sub.unsubscribe();
            sub = null;
            stream$.complete()
        }
    }

    function fetchMore(variables: RestFetchMoreOption['variables']) {
        return new Promise((resolve) => {
            // 这里记录一下请求开始时的 info 信息，避免并发请求 status 错乱
            const singleInfo = {
                ...info
            }
            const id = ++requestId
            const reason = requestReason.value = RequestReason.fetchMore
            singleInfo.loading = info.loading = true;
            const params: RestRequestConfig = {
                url: url.value,
                method: option.method,
                variables,
                timeout: option.timeout,
            };

            if (option.headers) {
                params.headers = deepMerge({}, params.headers || {}, option.headers);
            }

            stream$.next({
                id,
                url: params.url,
                variables: params.variables,
                requestReason: requestReason.value,
                status: getStatus(singleInfo, reason),
                data: undefined,
                loading: true,
                error: undefined,
            })

            const observable = client!.query<DataType>(params, option.fetchPolicy, hydrationStatus);
            observable.subscribe({
                next: (data) => {
                    singleInfo.error = info.error = undefined;
                    singleInfo.data = info.data = data && option.updateQuery ? option.updateQuery(info.data, data) : data;
                    singleInfo.loading = info.loading = false;

                    stream$.next({
                        id,
                        url: params.url,
                        variables: params.variables,
                        requestReason: requestReason.value,
                        status: getStatus(singleInfo, reason),
                        data: info.data,
                        loading: false,
                        error: undefined,
                    })
                    resolve(undefined);
                },
                error: (e) => {
                    singleInfo.error = info.error = e;
                    singleInfo.loading = info.loading = false;

                    stream$.next({
                        id,
                        url: params.url,
                        variables: params.variables,
                        requestReason: requestReason.value,
                        status: getStatus(singleInfo, reason),
                        data: undefined,
                        loading: false,
                        error: info.error,
                    })
                    resolve(undefined);
                },
            });
        });
    }

    function onNext(sub: (params: { data: DataType; loading: boolean; error: any }) => void) {
        // TODO
    }

    return {
        info,
        init,
        refetch: () => {
            requestReason.value = RequestReason.refetch;
            fetch();
        },
        prefetch: fetch,
        fetchMore,
        destroy,
        onNext,
        requestReason,
        stream$
    };
}
