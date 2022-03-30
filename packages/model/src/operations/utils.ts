import type {
    VariablesFn,
    MutationVariablesFn,
    RestQueryOptions,
    GQLQueryOptions,
    RestMutationOptions,
    GQLMutationOptions,
} from './types';
import type { Route } from '../dep';

import { reactive, computed } from '../dep';


export function initDataType<DataType>() {
    const data = {
        data: undefined as DataType | undefined,
        loading: false,
        error: undefined as any
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

    return {
        info,
        skip,
        pollInterval,
        variables,
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
}