import type { CreateMutationOptions, MutationVariable } from './types';
import type { Client } from '../clients';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { initDataType } from './core';

export function createMutation<ModelType, DataType>(
    option: CreateMutationOptions<ModelType, DataType>,
    model: ModelType,
    route: RouteLocationNormalizedLoaded,
    client?: Client,
){

    if (!client) {
        throw new Error('No Rest Client has been set');
    }
    const info = initDataType<DataType>();

    function variables<T>(params: T) {
        if (option.variables && typeof option.variables === 'function') {
            return (option.variables as MutationVariable<ModelType, any>).call(
                model,
                params,
                route,
            );
        }
        return params;
    }


    function mutate<T extends Record<string, any>>(params: T) {
        info.loading = true;
        info.error = undefined;

        return client!.mutate<DataType>(variables(params), option.extraParams).then(data => {
            info.error = undefined;
            if (data) {
                info.data = data;
            }
            info.loading = false;
        }).catch(e => {
            info.error = e;
            info.loading = false;
        });
    }

    return {
        info,
        mutate,
    };
}
