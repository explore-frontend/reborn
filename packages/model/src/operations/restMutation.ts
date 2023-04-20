import type { RestMutationOptions, MutationVariablesFn } from './types';
import type { Client } from '../clients';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { initDataType } from './core';

export function createRestMutation<ModelType, DataType>(
    option: RestMutationOptions<ModelType>,
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
            return (option.variables as MutationVariablesFn<ModelType>).call(
                model,
                params,
                route,
            );
        }
        return params;
    }

    function url<T extends Record<string, any>>(params: T) {
        if (option.url && typeof option.url === 'function') {
            return option.url.call(
                model,
                route,
                params,
            );
        }
        return option.url;
    }

    function mutate<T extends Record<string, any>>(params: T) {
        info.loading = true;
        info.error = null;
        return client!.mutate<DataType>({
            url: url(variables(params)),
            headers: option.headers,
            method: option.method,
            variables: variables(params),
            timeout: option.timeout,
        }).then(data => {
            info.error = null;
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
