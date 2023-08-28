import type {
    VariablesFn,
    MutationVariablesFn,
    RestQueryOptions,
    GQLQueryOptions,
    RestMutationOptions,
    GQLMutationOptions,
} from './types';
import { RequestReason, type InfoDataType } from './status';
import type { Route } from 'vue-router';

import { reactive, computed, watch, type ComputedRef } from 'vue-demi';
import { fromWatch } from '../utils';
import { Observable, merge, map } from 'rxjs';
import { MODE } from '../const';

export { isDef } from '../utils';

export function initDataType<DataType>() {
    const data: InfoDataType<DataType> = {
        data: undefined,
        loading: false,
        error: undefined
    };

    // 手动绕过UnwrapRef的坑……
    return reactive(data) as typeof data;
}

export function generateQueryOptions<ModelType, DataType>(
    option: RestQueryOptions<ModelType, DataType> | GQLQueryOptions<ModelType, DataType>,
    route: Route,
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
            return (option.variables as VariablesFn<ModelType>).call(model, route);
        }
        return option.variables;
    });


    const variables$ = fromWatch(() => variables.value, { immediate: true }).pipe(map(i => RequestReason.setVariables));
    const pollInterval$ = new Observable<RequestReason.poll>(subscriber => {
        let timeout: ReturnType<typeof setTimeout>;

        const poll = () => {
            if(MODE === 'SSR') {
                return
            }
            clearTimeout(timeout);
            if(pollInterval.value > 0) {
                timeout = setTimeout(doInterval, pollInterval.value);
            }
        }

        const doInterval = () => {
            subscriber.next(RequestReason.poll);
            poll();
        }

        watch(() => pollInterval.value, (val, oldVal) => {
            if (val === oldVal) {
                return;
            }
            poll();
        }, { immediate: true })
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

export function generateMutationOptions<ModelType, DataType>(
    option: RestMutationOptions<ModelType> | GQLMutationOptions<ModelType>,
    route: Route,
    model: ModelType,
) {
    const info = initDataType<DataType>();
    function variables(params: DataType) {
        if (option.variables && typeof option.variables === 'function') {
            return (option.variables as MutationVariablesFn<ModelType>).call(
                model,
                params,
                route,
            );
        }
        return params;
    }

    return {
        info,
        variables,
    };

}
