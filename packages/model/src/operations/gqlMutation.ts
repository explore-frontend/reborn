import type { GQLMutationOptions, MutationVariablesFn } from './types';
import type { Route } from 'vue-router';
import type { Client } from '../clients';

import { initDataType } from './core';


export function createGQLMutation<ModelType, DataType>(
    option: GQLMutationOptions<ModelType>,
    model: ModelType,
    route: Route,
    client?: Client,
) {
    if (!client) {
        throw new Error('No GQL Client has been set');
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

    return {
        info,
        mutate(params: any) {
            info.loading = true;
            info.error = undefined;

            return client.mutate<DataType>({
                // TODO
                mutation: '' as unknown as any,
                variables: variables(params),
            }).then(data => {
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
    };
}
