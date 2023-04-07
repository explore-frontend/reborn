import type { ModelInfo } from '../types';
import type { RebornInstanceType } from '../model';
import type { createApp } from 'vue';
import type { Client } from '../operations/types';
import type { RebornClient } from '../types';

import { Cache } from '../cache/index';
import { INJECT_KEY } from '../const';

export type GetModelInstance = ReturnType<typeof storeFactory>['getModelInstance'];

export function storeFactory() {
    const modelMap = new Map<ModelInfo<any>['constructor'], ModelInfo<any>>();
    const cache = new Cache();

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

    function restore(data: Record<string, any>): void {
        cache.restore(data);
    }

    function exportStates(): string {
        return cache.extract();
    }

    return {
        getModelInstance,
        addModel,
        removeModel,
        restore,
        exportStates,
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
    function install(app: ReturnType<typeof createApp>) {
        app.config.globalProperties.rebornStore = store;
        app.config.globalProperties.rebornClient = rebornClient;
        app.provide(INJECT_KEY, {
            store,
            rebornClient,
        });
    }

    const result = {
        install,
        registerClient,
    } as const;

    return result;
}
