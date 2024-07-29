import type { Constructor, OriginalModelInstance } from './types';
import type { FNModelCreator } from './fn-type';

import {
    onBeforeUnmount,
    onServerPrefetch,
    getCurrentInstance,
    effectScope,
    onMounted,
    nextTick,
    onScopeDispose,
    useSSRContext,
    inject,
    provide,
} from 'vue-demi';

import { createModelFromCA } from './fn-type';
import { createModelFromClass } from './class-type';

import { getRootStore } from '../const';

export type * from './types';
import { createModel, type FNModelConstructor } from './fn-type';

export { createModel, useGQLMutation, useGQLQuery, useRestMutation, useRestQuery } from './fn-type';

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
    if (store.hydrationStatus.value === 0) {
        store.hydrationStatus.value = 1;
        onMounted(() => {
            nextTick(() => {
                store.hydrationStatus.value = 2;
            });
        });
    }

    const storeModelInstance = store.addModel<T>(ctor);

    store.getCurrentModelInstance()?.subModels.add(ctor);
    if (!storeModelInstance.count) {
        const creator = 'type' in ctor ? createModelFromCA(ctor) : createModelFromClass(ctor);
        storeModelInstance.scope = effectScope(true);
        const scope = storeModelInstance.scope;

        scope?.run(() => {
            const prevModelInstance = store.getCurrentModelInstance();
            store.setCurrentModelInstance(storeModelInstance);
            const instance = creator.ctor(client) as OriginalModelInstance<T>;
            storeModelInstance.instance = instance;
            store.setCurrentModelInstance(prevModelInstance);
        });
    } else {
        // 收集子 model，重新 useModel
        storeModelInstance.subModels.forEach((ctor) => {
            useModel(ctor);
        });
    }
    storeModelInstance.count++;

    const handleUnmount = () => {
        storeModelInstance.count--;
        if (storeModelInstance.count === 0 && storeModelInstance.instance) {
            storeModelInstance.instance.destroy();
            storeModelInstance.instance = null;
            storeModelInstance.scope?.stop();
            storeModelInstance.scope = null;
            store.removeModel<T>(ctor);
        }
    };

    onBeforeUnmount(() => {
        // TODO 父 model 不 销毁子 model 不能销毁
        handleUnmount();
    });

    const ssrContext = useSSRContext() ?? {};
    const progress: any[] | undefined = inject('ssr-render');
    const component = getCurrentInstance()?.type;
    provide('model-tag', new Set().add(storeModelInstance))
    // 父元素被收集过了，就不收集子元素，之后只需要重新渲染父节点就可以
    const modelTag = inject('model-tag', new Set())
    if(!modelTag.has(storeModelInstance)) {
        component && progress?.push(component);
    }

    if(progress) {
        // storeModelInstance.instance?.prefetch();
    } else {

        onServerPrefetch(async () => {
            const prefetch = storeModelInstance.instance?.prefetch();
            ssrContext.prefetch = ssrContext.prefetch ?? [];
            ssrContext.prefetch.push(prefetch);
            if (!progress) {
                await prefetch;
            }
            handleUnmount();
            return;
        });
    }

    return storeModelInstance.instance!.model as RebornInstanceType<T>;
}

/**
 *
 * @experimental
 * @param fn
 * @returns
 */
export function createModelFamily<T, P>(
    fnFactory: (params: P) => FNModelConstructor<T>,
): (params: P) => FNModelCreator<T> {
    const map = new Map();
    const wrapper = (params: P) => {
        const fn: FNModelConstructor<T> = (ctx) => {
            onScopeDispose(() => {
                map.delete(params);
            });
            const modelInstance = fnFactory(params)(ctx);
            return modelInstance;
        };
        return fn;
    };
    return (params: P) => {
        if (map.has(params)) {
            return map.get(params);
        }
        const model = createModel(wrapper(params));
        map.set(params, model);
        return model;
    };
}

export function createUseModel<T>(fn: FNModelConstructor<T>) {
    const model = createModel(fn);
    return () => useModel(model);
}

export { gqlQuery, gqlMutation, restQuery, restMutation } from './decorators';
