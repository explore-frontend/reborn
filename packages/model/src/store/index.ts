import type { ModelInfo } from './types';
import type { RebornInstanceType } from '../model';
import type { Ref } from 'vue-demi';
import type { Client, RebornClient } from '../clients';
import { ref } from 'vue-demi';
import { INJECT_KEY, ROOT_STORE_MAP, setMode } from '../const';

export type GetModelInstance = ReturnType<typeof storeFactory>['getModelInstance'];

export type Store = ReturnType<typeof storeFactory>;

// 0: 还未开始，1: 已注册，2: hydration完毕
export type HydrationStatus = Ref<0 | 1 | 2>;

export function storeFactory() {
    const modelMap = new Map<ModelInfo<any>['constructor'], ModelInfo<any>>();

    function getModelInstance<T>(constructor: ModelInfo<T>['constructor']): RebornInstanceType<typeof constructor> | null {

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
            subModels: new Set()
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

    let currentModelInstance: null | ModelInfo<any> = null
    function setCurrentModelInstance<T>(modelInstance: null | ModelInfo<T>) {
        currentModelInstance = modelInstance
    }

    function getCurrentModelInstance<T>() {
        return currentModelInstance
    }

    return {
        getModelInstance,
        addModel,
        removeModel,
        hydrationStatus,
        setCurrentModelInstance,
        getCurrentModelInstance,
    };
}

export function createStore() {
    const store = storeFactory();

    const rebornClient: RebornClient = {};

    function registerClient(client: Client): void {
        if (client.type === 'REST') {
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

    // 为了适配 vue 不同版本这里只能用 any 了
    function install(app: any, ssrMode: boolean = false) {
        // vue3
        if (app.config && typeof app.config.globalProperties === 'object') {
            app.config.globalProperties.rebornStore = store;
            app.config.globalProperties.rebornClient = rebornClient;
            // vue3 的 provide 根组件也能用
            app.provide(INJECT_KEY, {
                store,
                rebornClient,
            });
        // vue2.7
        } else {
            app.mixin({
                provide(this) {
                    if (this === this.$root) {
                        return {
                            [INJECT_KEY]: {
                                store,
                                rebornClient,
                            }
                        };
                    }
                },
                // 解决 vue2 根组件不能直接使用 model
                beforeCreate() {
                    if (this === this.$root) {
                        ROOT_STORE_MAP.set(this, {
                            store,
                            rebornClient,
                        })
                    }
                }
            });
        }

        setMode(ssrMode ? 'SSR' : 'SPA');
    }

    const result = {
        install,
        registerClient,
    } as const;

    return result;
}
