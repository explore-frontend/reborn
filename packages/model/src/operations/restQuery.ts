import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { Subscription } from 'rxjs';

import type { RestQueryOptions, RestFetchMoreOption } from './types';
import type { Client, RestRequestConfig } from '../clients';
import type { HydrationStatus, Store } from '../store';

import { generateQueryOptions } from './core';
import { computed } from 'vue';
import { deepMerge } from '../utils';

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
    const {
        info,
        skip,
        variables,
        fetchQuery$,
        prefetch,
    } = generateQueryOptions<ModelType, DataType>(option, route, model);

    const url = computed(() => {
        if (typeof option.url === 'function') {
            return option.url.call(model, route, variables.value);
        }
        return option.url;
    });

    function refetch() {
        info.loading = true;
        return new Promise(resolve => {
            const clientParams = {
                url: url.value,
                headers: option.headers,
                method: option.method,
                fetchPolicy: option.fetchPolicy,
                variables: variables.value,
                timeout: option.timeout,
            };
            client!.request<DataType>(
                clientParams,
                option.fetchPolicy,
                hydrationStatus,
            ).then(data => {
                info.error = null;
                if (data) {
                    info.data = data;
                }
                info.loading = false;
                resolve(undefined);
            }).catch(e => {
                info.error = e;
                info.loading = false;
                resolve(undefined);
            });
        });
    }

    let sub: Subscription | null = null;

    function init() {
        sub = fetchQuery$.subscribe(() => {
            if (skip.value) {
                return;
            }
            refetch();
        });
    }

    function destroy() {
        if (sub) {
            sub.unsubscribe();
            sub = null;
        }
    }

    function fetchMore(variables: RestFetchMoreOption['variables']) {
        return new Promise(resolve => {
            info.loading = true;
            const params: RestRequestConfig = {
                url: url.value,
                method: option.method,
                variables,
                timeout: option.timeout,
            };

            if (option.headers) {
                params.headers = deepMerge({}, params.headers || {}, option.headers);
            }

            client!.request<DataType>(
                params,
                option.fetchPolicy,
                hydrationStatus,
            ).then(data => {
                info.error = null;
                info.data = data && option.updateQuery ? option.updateQuery(info.data, data) : data;
                info.loading = false;
                resolve(undefined);
            }).catch(e => {
                info.error = e;
                info.loading = false;
                resolve(undefined);
            });
        });
    }

    function onNext(sub: (params: { data: DataType; loading: boolean, error: any}) => void) {
        // TODO
    }

    return {
        info,
        init,
        refetch,
        fetchMore,
        destroy,
        onNext,
    };
}
