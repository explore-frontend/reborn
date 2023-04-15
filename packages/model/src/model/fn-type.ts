import type { ModelCotrInfo } from './types';
import type { RebornClient } from '../clients';
import type {
    GQLMutationOptions,
    GQLQueryOptions,
    RestMutationOptions,
    RestQueryOptions,
} from '../operations/types';
import type { GetModelInstance } from '../store';
import type { Ref } from 'vue';

import {
    createGQLMutation,
    createGQLQuery,
    createRestMutation,
    createRestQuery,
} from '../operations';
import { getCurrentInstance, toRefs } from 'vue';
import { getRootStore } from '../const';
import { useStatus } from '../operations/status';


let creatingModelCount = 0;
const tempQueryList: Array<ReturnType<typeof createRestQuery> | ReturnType<typeof createGQLQuery>> = [];

export const useRestQuery = <T>(options: RestQueryOptions<null, T>) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useRestQuery with createModel context `);
    }
    const route = vm.proxy!.$route;
    const { rebornClient: client, store } = getRootStore();

    const query = createRestQuery<null, T>(options, null, route, store, client.rest);
    tempQueryList.push(query);

    const status = useStatus(query.info);
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
    };
};

export const useGQLQuery = <T>(options: GQLQueryOptions<null, T>) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useGQLQuery with createModel context `);
    }

    const route = vm.proxy!.$route;
    const { rebornClient: client, store } = getRootStore();

    const query = createGQLQuery<null, T>(options, null, route, store, client.rest);
    tempQueryList.push(query);

    const status = useStatus(query.info);
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
    }
}

export const useRestMutation = <T>(options: RestMutationOptions) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useRestMutation with createModel context `);
    }
    const route = vm.proxy!.$route;
    const { rebornClient: client } = getRootStore();

    return createRestMutation<null, T>(options, null, route, client.rest);
}
export const useGQLMutation = <T>(options: GQLMutationOptions) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use useGQLMutation with createModel context `);
    }
    const route = vm.proxy!.$route;
    const { rebornClient: client } = getRootStore();

    return createGQLMutation<null, T>(options, null, route, client.rest);
}

export type FNModelCreator<T> = {
    type: string,
    creator: () => { model: T, queryList: Array<ReturnType<typeof createRestQuery> | ReturnType<typeof createGQLQuery>>};
}

export function createModelFromCA<T>(
    fn: FNModelCreator<T>,
): ModelCotrInfo<T> {
    return {
        type: 'FunctionalModel',
        cotr: () => {
            const { model, queryList } = fn.creator();

            // 延迟初始化，保证query间依赖
            if (queryList.length && typeof window !== 'undefined') {
                queryList.forEach(query => query.init());
            }

            function destroy() {
                if (queryList) {
                    queryList.forEach(i => i.destroy());
                    queryList.length = 0
                }
            }

            return {
                model,
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