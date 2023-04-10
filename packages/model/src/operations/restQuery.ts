/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 */

import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { Subscription } from 'rxjs';

import type { RestQueryOptions, RestFetchMoreOption, RestClientParams } from './types';
import type { Client } from '../clients';
import type { Store } from '../store';

import { generateQueryOptions } from './core';
import { computed, watch, nextTick } from 'vue';
import { deepMerge } from '../utils';

export function createRestQuery<ModelType, DataType>(
    option: RestQueryOptions<ModelType, DataType>,
    model: ModelType,
    route: RouteLocationNormalizedLoaded,
    store: Store,
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
    } = generateQueryOptions<ModelType, DataType>(option, route, model);

    const fetchPolicy = option.fetchPolicy || 'cache-and-network';

    const url = computed(() => {
        if (typeof option.url === 'function') {
            return option.url.call(model, route, variables.value);
        }
        return option.url;
    });

    function refetch() {
        info.loading = true;
        // TODO差缓存数据做SSR还原
        return new Promise(resolve => {
            client!.request<DataType>({
                url: url.value,
                headers: option.headers,
                credentials: option.credentials,
                method: option.method,
                variables: variables.value,
                timeout: option.timeout,
            }).then(data => {
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
            const params: RestClientParams = {
                url: url.value,
                method: option.method,
                variables,
                timeout: option.timeout,
            };

            if (option.headers) {
                params.headers = deepMerge({}, params.headers || {}, option.headers);
            }

            client!.request<DataType>(params).then(data => {
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

    function prefetch() {
        // TODO
    }

    function onNext() {

    }

    return {
        info,
        init,
        refetch,
        fetchMore,
        destroy,
        prefetch,
        onNext,
    };
}
