import type { Constructor, RebornClient, OriginalModelInstance } from './types';
import { createApp, effectScope } from 'vue';
import type { Client } from './operations/types';
import type { FNModelCreator } from './model';

import {
    onBeforeUnmount,
    onServerPrefetch,
    getCurrentInstance,
} from 'vue';
import { storeFactory } from './store';
import { createModelFromCA, createModelFromClass } from './model';

export type MyCon<T> = FNModelCreator<T> | Constructor<T>;
export type RebornInstanceType<T extends MyCon<any>> = T extends MyCon<infer U> ? U : never;

export function useModel<T extends MyCon<any> = MyCon<any>>(ctor: T): RebornInstanceType<T> {
    const instance = getCurrentInstance();
    if (!instance) {
        throw new Error('useModel must use in a setup context!');
    }

    // Vue3中通过globalProperties来拿
    const root = instance.appContext.config.globalProperties;
    // TODO小程序的适配后面在做
    const store = root.rebornStore as ReturnType<typeof storeFactory>;
    const client = root.rebornClient;

    if (!store) {
        throw new Error('There is no reborn-model store in your root vm!!');
    }

    const storeModelInstance = store.addModel<T>(ctor);

    if (!storeModelInstance.count) {
        const creator = 'type' in ctor
            ? createModelFromCA(ctor)
            : createModelFromClass(ctor);
        storeModelInstance.scope = effectScope(true);
        const scope = storeModelInstance.scope;

        scope?.run(() => {
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
            storeModelInstance.scope?.stop();
            storeModelInstance.scope = effectScope(true);
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
    function install(app: ReturnType<typeof createApp>) {
        app.config.globalProperties.rebornStore = store;
        app.config.globalProperties.rebornClient = rebornClient;
    }

    const result = {
        install,
        registerClient,
    } as const;

    return result;
}
