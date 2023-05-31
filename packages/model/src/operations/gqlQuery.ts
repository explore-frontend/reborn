import type { Route } from 'vue-router';
import type { Subscription } from 'rxjs';

import type { Client } from '../clients';
import type { GQLQueryOptions, GQLFetchMoreOptions } from './types';
import type { HydrationStatus } from '../store';

import { computed, nextTick } from 'vue-demi';
import { interval } from 'rxjs';
import { generateQueryOptions } from './core';

export function createGQLQuery<ModelType, DataType>(
    option: GQLQueryOptions<ModelType, DataType>,
    model: ModelType,
    route: Route,
    hydrationStatus: HydrationStatus,
    client?: Client,
) {
    if (!client) {
        throw new Error('No GQL Client has been set');
    }
    const {
        info,
        skip,
        pollInterval,
        variables,
    } = generateQueryOptions<ModelType, DataType>(option, route, model);

    const queryOptions = computed(() => {
        return {
            ...option,
            variables: variables.value,
            skip: skip.value,
            pollInterval: pollInterval.value,
        };
    });

    const optionsComputed = computed(() => [
        variables.value,
        skip.value,
        pollInterval.value,
    ]);

    let pollIntervalSub: Subscription | null = null;


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

    function init() {
        // TODO
    }

    function destroy() {
        // TODO
    }

    function fetchMore(variables: GQLFetchMoreOptions['variables']) {
        // TODO
    }

    // refetch 只会手动调用
    // refetch 调用的时候不需要管！
    function refetch() {
        // TODO
    }

    function onNext() {
        // TODO
    }

    return {
        info,
        init,
        destroy,
        fetchMore,
        refetch,
        onNext,
    };
}
