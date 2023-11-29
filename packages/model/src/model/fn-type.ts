import type { ModelCotrInfo } from './types';
import type {
    GQLMutationOptions,
    GQLQueryOptions,
    RestMutationOptions,
    RestQueryOptions,
    Route,
} from '../operations/types';
import type { GetModelInstance } from '../store';
import type { ComputedRef, Ref } from 'vue-demi';

import {
    createGQLMutation,
    createGQLQuery,
    createRestMutation,
    createRestQuery,
} from '../operations';
import { getCurrentInstance, shallowReactive, toRefs, watch } from 'vue-demi';
import { getRootStore, RENDER_MODE } from '../const';
import { StateStatus, useStatus } from '../operations/status';


let creatingModelCount = 0;

interface Hook {
    init?(): void
    prefetch?(): Promise<unknown> | unknown
    destroy?(): void
}
const tempQueryList: Array<Hook> = [];

const useRoute = (vm: Exclude<ReturnType<typeof getCurrentInstance>, null>) => {
    const route = shallowReactive(Object.assign({}, vm.proxy!.$route))
    watch(() => vm.proxy!.$route, ($route) => {
        Object.assign(route, $route)
    })
    return route as Route
}

export const useRestQuery =  <DataType, VariablesType extends Record<string, any> = Record<string, any>>(options: RestQueryOptions<null, DataType, VariablesType>) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useRestQuery with createModel context `);
    }
    const route = useRoute(vm);
    const { rebornClient: client, store } = getRootStore();

    const query = createRestQuery<null, DataType, VariablesType>(
        options,
        null,
        route,
        store.hydrationStatus,
        client.rest
    );
    tempQueryList.push(query as ReturnType<typeof createRestQuery>);

    const status: ComputedRef<StateStatus> = useStatus(query.info, query.requestReason);
    const { loading, error, data } = toRefs(query.info);

    return {
        info: query.info,
        status,
        loading,
        error,
        data: data as Ref<DataType | undefined>,
        refetch: query.refetch,
        fetchMore: query.fetchMore,
        onNext: query.onNext,
        requestReason: query.requestReason,
        stream$: query.stream$
    };
};

export const useGQLQuery = <T>(options: GQLQueryOptions<null, T>) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useGQLQuery with createModel context `);
    }

    const route = useRoute(vm);
    const { rebornClient: client, store } = getRootStore();

    const query = createGQLQuery<null, T>(options, null, route, store.hydrationStatus, client.rest);
    tempQueryList.push(query);

    const status: ComputedRef<StateStatus> = useStatus(query.info, query.requestReason);
    const { loading, error, data } = toRefs(query.info);

    return {
        info: query.info,
        status,
        loading,
        error,
        data: data as Ref<T | undefined>,
        refetch: query.refetch,
        fetchMore: query.fetchMore,
        onNext: query.onNext,
        requestReason: query.requestReason
    }
}

export const useRestMutation = <DataType, VariablesType extends Record<string, any> = Record<string, any>, ParamsType = VariablesType, ContextType = any>(options: RestMutationOptions) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useRestMutation with createModel context `);
    }
    const route = useRoute(vm);
    const { rebornClient: client } = getRootStore();

    const mutation = createRestMutation<null, DataType, VariablesType, ParamsType, ContextType>(options, null, route, client.rest);
    tempQueryList.push(mutation);


    return {
        info: mutation.info,
        mutate: mutation.mutate,
        stream$: mutation.stream$
    }
}
export const useGQLMutation = <T>(options: GQLMutationOptions) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useGQLMutation with createModel context `);
    }
    const route = useRoute(vm);
    const { rebornClient: client } = getRootStore();

    return createGQLMutation<null, T>(options, null, route, client.rest);
}

export type FNModelCreator<T> = {
    type: string,
    creator: () => { model: T, queryList: Array<Hook> };
}

export function createModelFromCA<T>(
    fn: FNModelCreator<T>,
): ModelCotrInfo<T> {
    return {
        type: 'FunctionalModel',
        cotr: () => {
            const { model, queryList } = fn.creator();

            // 延迟初始化，保证query间依赖
            if (queryList.length && RENDER_MODE === 'SPA') {
                queryList.forEach(query => query.init?.());
            }

            // prefetch 只触发一次
            let prefetchPromise: undefined | Promise<unknown[]>
            function prefetch() {
                if (!prefetchPromise) {
                    prefetchPromise = Promise.all(queryList.map(query => query.prefetch?.()));
                }
                return prefetchPromise
            }

            function destroy() {
                if (queryList) {
                    queryList.forEach(i => i.destroy?.());
                    queryList.length = 0
                }
            }

            return {
                model,
                prefetch,
                destroy,
            };
        },
    };
}

export type FNModelConstructor<T> = (ctx: { getModelInstance: GetModelInstance }) => T

export function createModel<T>(fn: FNModelConstructor<T>) {
    return {
        type: 'FN',
        creator: () => {
            creatingModelCount++;
            const { store } = getRootStore();

            const model = fn({
                getModelInstance: store.getModelInstance,
            });
            const queryList = [...tempQueryList];
            creatingModelCount--;
            tempQueryList.length = 0;

            return {
                queryList,
                model,
            };
        }
    } as FNModelCreator<T>;
}
