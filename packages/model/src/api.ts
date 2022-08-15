import type { Constructor, RebornClient, ModelCotrInfo, OriginalModelInstance } from './types';
import type { VueConstructor, createApp } from './dep';
import type { Client } from './operations/types';
import type { FNModelCreator } from './model';

import {
    Vue,
    onBeforeUnmount,
    onServerPrefetch,
    getCurrentInstance,
} from './dep';
import { storeFactory } from './store';
import { createModelFromCA, createModelFromClass, BaseModel } from './model';

export type MyCon<T> = FNModelCreator<T> | Constructor<T>;
export type RebornInstanceType<T extends MyCon<any>> = T extends MyCon<infer U> ? U : never;

export function useModel<T extends MyCon<any> = MyCon<any>>(ctor: T): RebornInstanceType<T> {
    const instance = getCurrentInstance();
    if (!instance) {
        throw new Error('useModel must use in a setup context!');
    }
    const root = instance.root.proxy;
    // TODO小程序的适配后面在做
    const store = root.rebornStore;
    const client = root.rebornClient;

    if (!store) {
        throw new Error('There is no reborn-model store in your root vm!!');
    }

    const storeModelInstance = store.addModel<T>(ctor);

    if (!storeModelInstance.count) {
        const creator = 'type' in ctor
            ? createModelFromCA(ctor)
            : createModelFromClass(ctor);
        const scope = storeModelInstance.scope;

        scope.run(() => {
            const instance = creator.cotr(client) as OriginalModelInstance<T>;
            storeModelInstance.instance = instance;
        });
    }
    storeModelInstance.count++;

    onBeforeUnmount(() => {
        storeModelInstance.count--;
        if (storeModelInstance.count === 0 && storeModelInstance.instance) {
            storeModelInstance.instance.destroy();
            storeModelInstance.instance = null;
            storeModelInstance.scope.stop();
            store.removeModel<T>(ctor);
        }
    });
    onServerPrefetch(() => {
        // return storeModelInstance.instance?.prefetch();
    });

    return storeModelInstance.instance!.model as RebornInstanceType<T>;
}

export function createStore() {
    const store = storeFactory();

    const rebornClient: RebornClient = {};

    function registerClient(type: 'REST' | 'GQL', client: Client): void {
        if (type === 'REST') {
            if (rebornClient.rest) {
                console.warn('You have already registed a restClient yet');
                return;
            }
            rebornClient.rest = client;
            return;
        } else {
            if (rebornClient.gql) {
                console.warn('You have already registed a gqlClient yet');
                return;
            }
            rebornClient.gql = client;
        }
    }

    // TODO 这里在Vue2和Vue3里的实现需要不同
    function install(VueConstructor: VueConstructor, app: ReturnType<typeof createApp>) {
        app.mixin({
            created(this: Vue) {
                // Vue2里use拿不到app实例，也没有provide，所以只能先这么玩了
                this.$root.rebornStore = this.$root.rebornStore || store;
                this.$root.rebornClient = this.$root.rebornClient || rebornClient;
            },
        })
    }

    const result = {
        install,
        registerClient,
    } as const;

    return result;
}
