import type { RestMutationOptions, MutationVariablesFn, Route } from './types';
import type { Client } from '../clients';

import { initDataType } from './core';
import { Observable, Subject, mergeAll, switchAll } from 'rxjs';
import { type InfoDataType } from './status';

export function createRestMutation<ModelType, DataType>(
    option: RestMutationOptions<ModelType>,
    model: ModelType,
    route: Route,
    client?: Client,
) {

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

    const requestStream$ = new Subject<Observable<InfoDataType<DataType> & {
        id: number
        url: string
        variables?: Record<string, unknown>
    }>>()

    const stream$ = requestStream$.pipe(mergeAll())

    requestStream$.pipe(switchAll()).subscribe(value => {
        info.loading = value.loading
        if (!info.loading) {
            info.error = value.error
            if (value.data) {
                info.data = value.data
            }
        }
    })

    function destroy() {
        requestStream$.complete()
    }


    let requestId = 0
    function mutate<T extends Record<string, any>>(params: T, context?: any) {
        const id = ++requestId
        const mutateParams = {
            url: url(variables(params)),
            headers: option.headers,
            method: option.method,
            variables: variables(params),
            timeout: option.timeout,
        }
        const mutation$ = new Subject<InfoDataType<DataType> & {
            id: number
            url: string
            variables?: Record<string, unknown>
            context: any
        }>()

        requestStream$.next(mutation$)

        mutation$.next({
            id,
            url: mutateParams.url,
            variables: mutateParams.variables,
            loading: true,
            data: undefined,
            error: undefined,
            context
        })

        return client!.mutate<DataType>(mutateParams).then(data => {
            mutation$.next({
                id,
                url: mutateParams.url,
                variables: mutateParams.variables,
                loading: false,
                data,
                error: undefined,
                context
            })
        }).catch(e => {
            mutation$.next({
                id,
                url: mutateParams.url,
                variables: mutateParams.variables,
                loading: false,
                data: undefined,
                error: e,
                context
            })
        }).finally(() => {
            mutation$.complete()
        })
    }

    return {
        info,
        mutate,
        stream$,
        destroy
    };
}
