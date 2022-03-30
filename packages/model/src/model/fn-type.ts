import type { ModelCotrInfo, RebornClient } from '../types';
import type {
    GQLMutationOptions,
    GQLQueryOptions,
    RestMutationOptions,
    RestQueryOptions,
} from '../operations/types';
import type { GetModelInstance } from '../store';

import {
    createGQLMutation,
    createGQLQuery,
    createRestMutation,
    createRestQuery,
} from '../operations';
import { getCurrentInstance } from '../dep';


let modelCreatingFlag = false;
const tempQueryList: Array<ReturnType<typeof createRestQuery> | ReturnType<typeof createGQLQuery>> = [];

export const useRestQuery = <T>(options: RestQueryOptions<null, T>) => {
    const vm = getCurrentInstance();
    if (!modelCreatingFlag || !vm) {
        throw new Error(`You should use useRestQuery with createModel context `);
    }
    const route = vm.proxy.$route;
    const client = vm.root.proxy.rebornClient;

    const query = createRestQuery<null, T>(options, null, route, client.rest);
    tempQueryList.push(query);
    return {
        info: query.info,
        refetch: query.refetch,
        fetchMore: query.fetchMore,
        onNext: query.onNext,
    };
};
export const useGQLQuery = <T>(options: GQLQueryOptions<null, T>) => {
    const vm = getCurrentInstance();
    if (!modelCreatingFlag || !vm) {
        throw new Error(`You should use useGQLQuery with createModel context `);
    }

    const route = vm.proxy.$route;
    const client = vm.root.proxy.rebornClient;

    const query = createGQLQuery<null, T>(options, null, route, client.rest);
    tempQueryList.push(query);
    return {
        info: query.info,
        refetch: query.refetch,
        fetchMore: query.fetchMore,
        onNext: query.onNext,
    }
}

export const useRestMutation = <T>(options: RestMutationOptions) => {
    const vm = getCurrentInstance();
    if (!modelCreatingFlag || !vm) {
        throw new Error(`You should use useRestMutation with createModel context `);
    }
    const route = vm.proxy.$route;
    const client = vm.root.proxy.rebornClient;

    return createRestMutation<null, T>(options, null, route, client.rest);
}
export const useGQLMutation = <T>(options: GQLMutationOptions) => {
    const vm = getCurrentInstance();
    if (!modelCreatingFlag || !vm) {
        throw new Error(`You should use useGQLMutation with createModel context `);
    }
    const route = vm.proxy.$route;
    const client = vm.root.proxy.rebornClient;

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
        type: 'FunctionlModel',
        cotr: (client: RebornClient) => {
            const vm = getCurrentInstance()!;
            const { model, queryList } = fn.creator();

            // 延迟初始化，保证query间依赖
            if (queryList.length && !vm.proxy.$isServer) {
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
            modelCreatingFlag = true;
            const vm = getCurrentInstance()!;
            const store = vm.root.proxy.rebornStore;

            const model = fn({
                getModelInstance: store.getModelInstance,
            });
            const queryList = [...tempQueryList];
            modelCreatingFlag = false;
            tempQueryList.length = 0;

            return {
                queryList,
                model,
            };
        }
    } as FNModelCreator<T>;
}