import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { map, merge, Observable, type Subscription } from 'rxjs';

import type { CreateQueryOptions, QueryOptions, QueryVariable } from './types';
import type { Client, } from '../clients';
import type { HydrationStatus } from '../store';

import { computed, ref, watch, type Ref } from 'vue';
import { deepMerge, fromWatch } from '../utils';
import { RequestReason } from './status';
import { initDataType } from './core';

function generateQueryOptions<ModelType, DataType>(
    option: CreateQueryOptions<ModelType, DataType>,
    route: RouteLocationNormalizedLoaded,
    model: ModelType,
) {
    const info = initDataType<DataType>();
    const skip = computed(() => {
        if (typeof option.skip === 'function') {
            return option.skip.call(model, route);
        }
        return !!option.skip;
    });

    const pollInterval = computed(() => {
        if (typeof option.pollInterval === 'function') {
            return option.pollInterval.call(model, route);
        }
        return option.pollInterval || 0;
    });

    const variables = computed(() => {
        if (typeof option.variables === 'function') {
            return (option.variables as QueryVariable<ModelType, any>).call(model, route);
        }
        return option.variables;
    });


    const variables$ = fromWatch(() => variables.value, { immediate: true }).pipe(map(i => RequestReason.setVariables))
    const pollInterval$ = new Observable<RequestReason.poll>(subscriber => {
        let timeout: ReturnType<typeof setTimeout>;
        watch(() => pollInterval.value, (val, oldVal) => {
            if (val === oldVal) {
                return;
            }
            if (val <= 0) {
                clearTimeout(timeout);
                return;
            }

            poll();
        }, { immediate: true })
        const doInterval = () => {
            subscriber.next(RequestReason.poll);
            poll();
        }

        const poll = () => {
            clearTimeout(timeout);
            setTimeout(doInterval, pollInterval.value);
        }
    });

    const fetchQuery$ = merge(
        variables$,
        pollInterval$,
    );

    return {
        info,
        skip,
        pollInterval,
        variables,
        fetchQuery$,
        prefetch: option.prefetch || true,
    };
}

export function createQuery<ModelType, DataType>(
    option: CreateQueryOptions<ModelType, DataType>,
    model: ModelType,
    route: RouteLocationNormalizedLoaded,
    hydrationStatus: HydrationStatus,
    client?: Client,
) {
    if (!client) {
        throw new Error('No Rest Client has been set');
    }
    const { info, skip, variables, fetchQuery$, prefetch } = generateQueryOptions(
        option,
        route,
        model,
    );

    const genParams = (additionVariables?: any) => {
        return {
            variables: variables.value,
            extraParams: option.extraParams,
        }
    }

    function fetch() {
        info.loading = true;
        return new Promise((resolve) => {
            const clientParams = genParams()
            // TODO后面再重写一下
            const subject = client!.query<DataType>(clientParams.variables, clientParams.extraParams, option.fetchPolicy, hydrationStatus);
            subject.subscribe({
                next: (data) => {
                    info.error = undefined;
                    if (data) {
                        info.data = data;
                    }
                    info.loading = false;
                    resolve(undefined);
                },
                error: (e) => {
                    info.error = e;
                    info.loading = false;
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
        }
    }

    function fetchMore(variables: typeof option['variables']) {
        return new Promise((resolve) => {
            requestReason.value = RequestReason.fetchMore
            info.loading = true;
            const params = genParams(variables)

            const observable = client!.query<DataType>(params.variables, params.extraParams, option.fetchPolicy, hydrationStatus);
            observable.subscribe({
                next: (data) => {
                    info.error = undefined;
                    info.data = data && option.updateQuery ? option.updateQuery(info.data, data) : data;
                    info.loading = false;
                    resolve(undefined);
                },
                error: (e) => {
                    info.error = e;
                    info.loading = false;
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
    };
}
