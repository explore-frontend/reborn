import type { ModelInfo } from './types';
import type { RebornInstanceType } from '../model';
import type { createApp, Ref } from 'vue';
import type { Client, RebornClient } from '../clients';

import { ref } from 'vue';
import { INJECT_KEY } from '../const';

export type GetModelInstance = ReturnType<typeof storeFactory>['getModelInstance'];

export type Store = ReturnType<typeof storeFactory>;

// 0: 还未开始，1: 已注册，2: hydration完毕
export type HydrationStatus = Ref<0 | 1 | 2>;

export type ENV = Ref<'WEB' | 'MINI_APP'>;

export function storeFactory() {
    const modelMap = new Map<ModelInfo<any>['constructor'], ModelInfo<any>>();

    function getModelInstance<T>(constructor: ModelInfo<T>['constructor']): RebornInstanceType<typeof constructor> | null{
        return modelMap.get(constructor)?.instance?.model as unknown as RebornInstanceType<typeof constructor>;
    }

    function addModel<T>(constructor: ModelInfo<T>['constructor']) {
        if (modelMap.has(constructor)) {
            return modelMap.get(constructor)! as ModelInfo<T>;
        }

        const storeModelInstance: ModelInfo<T> = {
            constructor,
            instance: null,
            count: 0,
            queryList: [],
            scope: null,
        };
        modelMap.set(constructor, storeModelInstance);
        return storeModelInstance as ModelInfo<T>;
    }

    function removeModel<T>(constructor: ModelInfo<T>['constructor']) {
        if (modelMap.has(constructor)) {
            modelMap.delete(constructor);
        }
    }

    const hydrationStatus: HydrationStatus = ref(0);
    const env: ENV = ref('WEB');

    return {
        getModelInstance,
        addModel,
        removeModel,
        hydrationStatus,
        env,
    };
}

export function createStore() {
    const store = storeFactory();

    const rebornClient: RebornClient = {};

    function registerClient(type: 'REST' | 'GQL', client: Client): void {
        if (type === 'REST') {
            if (rebornClient.rest) {
                console.warn('You have already registered a restClient yet');
                return;
            }
            rebornClient.rest = client;
            return;
        } else {
            if (rebornClient.gql) {
                console.warn('You have already registered a gqlClient yet');
                return;
            }
            rebornClient.gql = client;
        }
    }

    // TODO 这里在Vue2和Vue3里的实现需要不同
    function install(app: ReturnType<typeof createApp>, env: 'WEB' | 'MINI_APP' = 'WEB') {
        app.config.globalProperties.rebornStore = store;
        app.config.globalProperties.rebornClient = rebornClient;
        app.provide(INJECT_KEY, {
            store,
            rebornClient,
        });
        store.env.value = env;
    }

    const result = {
        install,
        registerClient,
    } as const;

    return result;
}
