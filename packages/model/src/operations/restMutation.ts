import type { RestMutationOptions, MutationVariablesFn, Route } from './types';
import type { Client } from '../clients';

import { initDataType } from './core';
import { Observable, Subject, mergeAll, switchAll } from 'rxjs';
import { type InfoDataType } from './status';

export function createRestMutation<ModelType, DataType, VariablesType extends Record<string, any> = Record<string, any>, ParamsType = VariablesType, ContextType = any>(
    option: RestMutationOptions<ModelType, VariablesType, ParamsType>,
    model: ModelType,
    route: Route,
    client?: Client,
) {
    if (!client) {
        throw new Error('No Rest Client has been set');
    }
    const info = initDataType<DataType>();
    function variables(params: ParamsType) {
        if (option.variables && typeof option.variables === 'function') {
            return (option.variables as MutationVariablesFn<ModelType, VariablesType, ParamsType>).call(
                model,
                params,
                route,
            );
        }
        return params as any as VariablesType;
    }

    function url(variables: VariablesType, params: ParamsType) {
        if (option.url && typeof option.url === 'function') {
            return option.url.call(model, route, variables, params);
        }
        return option.url;
    }

    const requestStream$ = new Subject<
        Observable<
            InfoDataType<DataType> & {
                id: number;
                url: string;
                variables?: VariablesType
                context?: ContextType
            }
        >
    >();

    const stream$ = requestStream$.pipe(mergeAll());

    requestStream$.pipe(switchAll()).subscribe((value) => {
        info.loading = value.loading;
        if (!info.loading) {
            info.error = value.error;
            if (value.data) {
                info.data = value.data;
            }
        }
    });

    function destroy() {
        requestStream$.complete();
    }

    let requestId = 0;
    function mutate<T = ParamsType, Context extends any = ContextType>(params: T, context?: Context) {
        const id = ++requestId;
        const mutateParams = {
            url: url(variables(params as any as ParamsType), params as any as ParamsType),
            headers: option.headers,
            method: option.method,
            variables: variables(params as any as ParamsType),
            timeout: option.timeout,
        };
        const mutation$ = new Subject<
            InfoDataType<DataType> & {
                id: number;
                url: string;
                variables?: VariablesType;
                context?: ContextType;
            }
        >();

        requestStream$.next(mutation$);

        mutation$.next({
            id,
            url: mutateParams.url,
            variables: mutateParams.variables,
            loading: true,
            data: undefined,
            error: undefined,
            context: context as any as ContextType,
        });

        return client!
            .mutate<DataType>(mutateParams)
            .then((data) => {
                mutation$.next({
                    id,
                    url: mutateParams.url,
                    variables: mutateParams.variables,
                    loading: false,
                    data,
                    error: undefined,
                    context: context as any as ContextType,
                });
            })
            .catch((e) => {
                mutation$.next({
                    id,
                    url: mutateParams.url,
                    variables: mutateParams.variables,
                    loading: false,
                    data: undefined,
                    error: e,
                    context: context as any as ContextType,
                });
            })
            .finally(() => {
                mutation$.complete();
            });
    }

    return {
        info,
        mutate,
        stream$,
        destroy,
    };
}
