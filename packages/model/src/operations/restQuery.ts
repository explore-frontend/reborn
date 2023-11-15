import { mergeAll, Observable, Subject, switchAll, type Subscription } from 'rxjs';

import type { RestQueryOptions, RestFetchMoreOption, Route } from './types';
import type { Client, RestRequestConfig } from '../clients';
import type { HydrationStatus, Store } from '../store';

import { generateQueryOptions } from './core';
import { ref, type Ref } from 'vue-demi';
import { deepMerge } from '../utils';
import { type InfoDataType, RequestReason, StateStatus, getStatus } from './status';

export function createRestQuery<ModelType, DataType, VariablesType extends Record<string, any>>(
    option: RestQueryOptions<ModelType, DataType, VariablesType>,
    model: ModelType,
    route: Route,
    hydrationStatus: HydrationStatus,
    client?: Client,
) {
    if (!client) {
        throw new Error('No Rest Client has been set');
    }
    const { info, skip, variables, fetchQuery$, url, prefetch } = generateQueryOptions<ModelType, DataType, VariablesType>(
        option,
        route,
        model,
    );

    const requestStream$ = new Subject<Observable<InfoDataType<DataType> & {
        id: number
        url: string
        variables?: VariablesType
        requestReason: RequestReason
        status: StateStatus,
    }>>()

    const stream$ = requestStream$.pipe(mergeAll())
    const requestReason: Ref<RequestReason>= ref<RequestReason>(RequestReason.setVariables);

    requestStream$.pipe(switchAll()).subscribe(value => {
        info.loading = value.loading
        if(!value.loading) {
            info.error = value.error
            if (value.data) {
                info.data = value.data
            }
        }
    })



    let requestId = 0
    function fetch(reason: RequestReason, variables: undefined | VariablesType) {
        // 这里记录一下请求开始时的 info 信息，避免并发请求 status 错乱
        const prevInfo = {
            ...info
        }
        requestReason.value = reason
        const id = ++requestId

        const beforeQueryParams = {
            url: url.value,
            variables
        }

        const clientParams = {
            headers: option.headers,
            method: option.method,
            fetchPolicy: option.fetchPolicy,
            timeout: option.timeout,
            ...beforeQueryParams,
            ...(option.beforeQuery?.(beforeQueryParams) ?? {}),
        };

        const query$ = new Subject<InfoDataType<DataType> & {
            id: number
            url: string
            variables?: VariablesType
            requestReason: RequestReason
            status: StateStatus,
        }>()
        requestStream$.next(query$)

        return new Promise((resolve) => {
            query$.next({
                id,
                url: clientParams.url,
                variables: clientParams.variables,
                requestReason: reason,
                status: getStatus({ ...prevInfo, loading: true }, reason),
                data: undefined,
                loading: true,
                error: undefined,
            })
            // TODO后面再重写一下
            const subject = client!.query<DataType>(clientParams, option.fetchPolicy, hydrationStatus);
            subject.subscribe({
                next: (data) => {
                    const infoData = data && option.updateQuery && reason === RequestReason.fetchMore ? option.updateQuery(prevInfo.data, data) : data;
                    query$.next({
                        id,
                        url: clientParams.url,
                        variables: clientParams.variables,
                        requestReason: reason,
                        status: getStatus({ error: undefined, data: infoData, loading: false }, reason),
                        data: infoData,
                        loading: false,
                        error: undefined,
                    })
                    resolve(undefined);
                },
                error: (e) => {
                    query$.next({
                        id,
                        url: clientParams.url,
                        variables: clientParams.variables,
                        requestReason: reason,
                        status: getStatus({ ...prevInfo, error: e, loading: false }, reason),
                        data: undefined,
                        loading: false,
                        error: e,
                    })
                    // error 之后不会触发 complete
                    query$.complete();
                    resolve(undefined);
                },
                complete: () => {
                    query$.complete();
                    // TODO先临时搞一下，后面再看怎么串一下Observable
                    subject.unsubscribe();
                },
            });
        });
    }


    let sub: Subscription | null = null;
    function init() {
        sub = fetchQuery$.subscribe((reason) => {
            if (skip.value) {
                return;
            }
            fetch(reason, variables.value);
        });
    }

    function destroy() {
        if (sub) {
            sub.unsubscribe();
            sub = null;
            requestStream$.complete()
        }
    }

    function fetchMore(variables: VariablesType) {
        return fetch(RequestReason.fetchMore, variables)
    }

    function onNext(sub: (params: { data: DataType; loading: boolean; error: any }) => void) {
        // TODO
    }

    return {
        info,
        init,
        refetch: () => {
            return fetch(RequestReason.refetch, variables.value);
        },
        prefetch: () => {
            if (!skip.value) {
                return fetch(RequestReason.setVariables, variables.value);
            }
        },
        fetchMore,
        destroy,
        onNext,
        requestReason,
        stream$
    };
}
