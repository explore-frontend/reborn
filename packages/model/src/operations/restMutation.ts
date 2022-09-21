/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 */
import type { RestMutationOptions, MutationVariablesFn } from './types';
import type { Client } from './types';
import type { Route } from 'vue-router';

import { initDataType } from './utils';

export function createRestMutation<ModelType, DataType>(
    option: RestMutationOptions<ModelType>,
    model: ModelType,
    route: Route,
    client?: Client,
){

    if (!client) {
        throw new Error('No Rest Client has been setted');
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
        return client!.request<DataType>({
            url: url(variables(params)),
            headers: option.headers,
            credentials: option.credentials,
            method: option.method,
            variables: variables(params),
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
