import type { Constructor, OriginalModelInstance } from './types';
import type { FNModelCreator } from './fn-type';

import {
    onBeforeUnmount,
    onServerPrefetch,
    getCurrentInstance,
    effectScope,
    onMounted
} from 'vue';

import { createModelFromCA } from './fn-type'
import { createModelFromClass } from './class-type';

import { getRootStore } from '../const';
import { nextTick } from 'process';

export type * from './types';

export {
    createModel,
    useGQLMutation,
    useGQLQuery,
    useRestMutation,
    useRestQuery,
} from './fn-type';

export { type FNModelCreator } from './fn-type';

export { BaseModel } from './class-type';


export type MyCon<T> = FNModelCreator<T> | Constructor<T>;
export type RebornInstanceType<T extends MyCon<any>> = T extends MyCon<infer U> ? U : never;

export function useModel<T extends MyCon<any> = MyCon<any>>(ctor: T): RebornInstanceType<T> {
    const instance = getCurrentInstance();
    if (!instance) {
        throw new Error('useModel must use in a setup context!');
    }

    // TODO小程序的适配后面在做
    const { store, rebornClient: client } = getRootStore();

    if (!store) {
        throw new Error('There is no reborn-model store in your root vm!!');
    }

    // 保证只注册一次
    if (!store.hydrationStatus) {
        store.hydrationStatus = 1;
        onMounted(() => {
            nextTick(() => {
                store.hydrationStatus = 2;
            });
        });
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

export {
    gqlQuery,
    gqlMutation,
    restQuery,
    restMutation,
} from './decorators';
