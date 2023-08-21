import type { ModelCotrInfo } from './types';
import type {
    CommonQueryOptions,
    CreateMutationOptions,
    CreateQueryOptions,
    GQLMutationOptions,
    GQLQueryOptions,
    MutationVariablesFn,
    QueryOptions,
    RestMutationOptions,
    RestQueryOptions,
    UrlFn,
    VariablesFn,
} from '../operations/types';
import type { GetModelInstance } from '../store';
import type { Ref } from 'vue';

import { getCurrentInstance, toRefs } from 'vue';
import { getRootStore, MODE } from '../const';
import { useStatus } from '../operations/status';
import { createMutation } from '../operations/mutation';
import { createQuery } from '../operations/query';
import { type RestExtraOptions, type RestVariables } from '../clients/rest-client';


let creatingModelCount = 0;
const tempQueryList: Array<ReturnType<typeof createQuery>> = [];

export const useQuery = <DataType>(clientKey: string, options: CreateQueryOptions<null, DataType>) => {
    const vm = getCurrentInstance()
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use use${clientKey.toUpperCase()}Query  with createModel context `);
    }

    const route = vm.proxy!.$route;
    const { rebornClient: client, store } = getRootStore();

    const query = createQuery<null, DataType>(
        options,
        null,
        route,
        store.hydrationStatus,
        client.rest
    );
    tempQueryList.push(query);

    const status = useStatus(query.info, query.requestReason);
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
        requestReason: query.requestReason
    };
}

export const useMutation = <DataType>(clientKey: string, options: CreateMutationOptions<null, DataType>) => {
    const vm = getCurrentInstance();
    if (creatingModelCount <= 0 || !vm) {
        throw new Error(`You should use use${clientKey.toUpperCase()}Mutation with createModel context `);
    }
    const route = vm.proxy!.$route;
    const { rebornClient: client } = getRootStore();
    return createMutation<null, DataType>(options, null, route, client.rest);
}


export const useRestQuery = <T>(options: RestQueryOptions<null, T>) => {
    const createOptions: CreateQueryOptions<null, T, RestExtraOptions, RestVariables> = {
        variables(route) {
            const variables = typeof options.variables === 'function' ? (options.variables as VariablesFn<null>).call(this, route) : options.variables
            const url = typeof options.url === 'function' ?options.url.call(this, route, variables) : options.url
            return {
                variables,
                url
            }
        },
        extraParams: {
            headers: options.headers,
            method: options.method,
            credentials: options.credentials,
            timeout: options.timeout
        },
        prefetch: options.prefetch,
        fetchPolicy: options.fetchPolicy,
        skip: options.skip,
        pollInterval: options.pollInterval,
        updateQuery: options.updateQuery,
    }

    const query = useQuery('REST', createOptions)
    return {
        ...query,
        fetchMore(variables: any) {
            query.fetchMore({
                variables,
            })
        }
    }
};

export const useGQLQuery = <T>(options: QueryOptions<null, T>) => {
    return useQuery('GQL', options)
}


export const useRestMutation = <T>(options: RestMutationOptions) => {
    const mutationOptions: CreateMutationOptions<null, T, RestExtraOptions, RestVariables> = {
        variables(route, params) {
            const variables = typeof options.variables === 'function' ? (options.variables as MutationVariablesFn<null>).call(this, params, route) : options.variables
            const url = typeof options.url === 'function' ?options.url.call(this, route, variables) : options.url
            return {
                variables,
                url
            }
        },
        extraParams: {
            headers: options.headers,
            method: options.method,
            credentials: options.credentials,
            timeout: options.timeout
        },
    }
    const mutation = useMutation('REST', mutationOptions)

    return {
        ...mutation,
    }

}
export const useGQLMutation = <T>(options: GQLMutationOptions) => {
    return useMutation('GQL', options as any)
}


export type FNModelCreator<T> = {
    type: string,
    creator: () => { model: T, queryList: Array<ReturnType<typeof createQuery>> };
}

export function createModelFromCA<T>(
    fn: FNModelCreator<T>,
): ModelCotrInfo<T> {
    return {
        type: 'FunctionalModel',
        cotr: () => {
            const { model, queryList } = fn.creator();

            // 延迟初始化，保证query间依赖
            if (queryList.length && MODE !== 'SSR') {
                queryList.forEach(query => query.init());
            }

            function prefetch() {
                return Promise.all(queryList.map(query => query.prefetch()));
            }

            function destroy() {
                if (queryList) {
                    queryList.forEach(i => i.destroy());
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
