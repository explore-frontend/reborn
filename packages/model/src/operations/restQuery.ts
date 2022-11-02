/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 */

import type { RestQueryOptions, RestFetchMoreOption, RestClientParams } from './types';
import type { Route } from 'vue-router';
import type { Client } from './types';
import type { Subscription } from 'rxjs';

import { interval } from 'rxjs';
import { generateQueryOptions } from './utils';
import { computed, watch, nextTick } from '@vue/composition-api';
import { deepMerge } from '../utils';


export function createRestQuery<ModelType, DataType>(
    option: RestQueryOptions<ModelType, DataType>,
    model: ModelType,
    route: Route,
    client?: Client,
) {
    if (!client) {
        throw new Error('No Rest Client has been set');
    }
    const {
        info,
        skip,
        pollInterval,
        variables,
    } = generateQueryOptions<ModelType, DataType>(option, route, model);

    const url = computed(() => {
        if (typeof option.url === 'function') {
            return option.url.call(model, route, variables.value);
        }
        return option.url;
    });

    const variablesComputed = computed(() => [variables.value, skip.value, url.value]);

    let pollIntervalSub: Subscription | null = null;

    function changeVariables() {
        nextTick(() => {
            if (skip.value) {
                return;
            }
            if (pollIntervalSub) {
                // 参数改变等待下次interval触发
                return;
            }
            refetch();
        });
    }

    const variablesWatcher = watch(() => variablesComputed.value, (newV, oldV) => {
        // TODO短时间内大概率会触发两次判断，具体原因未知= =
        if (newV.some((v, index) => oldV[index] !== v)) {
            changeVariables();
        }
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

    function changePollInterval() {
        nextTick(() => {
            if (pollIntervalSub) {
                pollIntervalSub.unsubscribe();
                pollIntervalSub = null;
            }
            if (!pollInterval.value) {
                return;
            }
            pollIntervalSub = interval(pollInterval.value)
                .subscribe({
                    next: () => refetch(),
                });
        });
    }

    const intervalWatcher = watch(() => pollInterval.value, (newV, oldV) => {
        // TODO短时间内大概率会触发两次判断，具体原因未知= =
        if (newV !== oldV) {
            changePollInterval();
        }
    });

    function init() {
        if (!skip.value) {
            refetch();
            changePollInterval();
        }
    }

    function destroy() {
        intervalWatcher();
        variablesWatcher();
        pollIntervalSub?.unsubscribe();
        pollIntervalSub = null;
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
