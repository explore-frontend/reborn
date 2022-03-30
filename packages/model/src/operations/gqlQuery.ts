/**
 * @file apollo query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 */

import type { Client } from './types';
import type { GQLQueryOptions, GQLFetchMoreOptions } from './types';
import type { Route } from '../dep';
import type { Subscription } from 'xstream';

import { computed, nextTick } from '../dep';
import xstream from 'xstream';
import { generateQueryOptions } from './utils';

export function createGQLQuery<ModelType, DataType>(
    option: GQLQueryOptions<ModelType, DataType>,
    model: ModelType,
    route: Route,
    client?: Client,
) {
    if (!client) {
        throw new Error('No GQL Client has been setted');
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

    function prefetch() {
        // TODO待补充
    }

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
            if (!pollInterval) {
                return;
            }
            pollIntervalSub = xstream
                .periodic(pollInterval.value)
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

    function fetchMore({ variables } : GQLFetchMoreOptions) {
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
        prefetch,
        init,
        destroy,
        fetchMore,
        refetch,
        onNext,
    };
}
