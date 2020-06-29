import Vue, { VueConstructor } from 'vue';
import {
    onBeforeUnmount,
    onServerPrefetch,
    getCurrentInstance,
} from '@vue/composition-api';
import { Constructor } from './types';
import { BaseModel } from './model';

export function defineReactive(obj: object, key: string, val?: any, customSetter?: (val?: any) => void, shallow?: boolean) {
    return Vue.util.defineReactive(obj, key, val, customSetter, shallow);
}

export function useApolloModel<T extends BaseModel>(ctor: Constructor<T>, context?: any) {
    const instance = getCurrentInstance();
    const root = instance?.$root;
    // 为了适配小程序，$store去原型上找一下
    const store = root?.$options.apolloStore || root?.apolloStore;
    if (!store) {
        throw new Error('There is no vue-apollo-model store in your root vm!!');
    }
    // TODO registerModel的参数后面需要改一下……
    const storeModelInstance = store.registerModel<T>(ctor);
    if (!storeModelInstance.count) {
        const instance = new ctor(
            root,
            store,
        );
        instance.init<T>();
        storeModelInstance.instance = instance
    }
    storeModelInstance.count++;

    Vue.nextTick(() => {
        // TODO这里可能涉及多次订阅导致性能问题，后面把subscription相关逻辑干了也许就解了……
        // 先临时通过hasSubscribed来判断
        if (!root?.$isServer && storeModelInstance.instance && !storeModelInstance.instance.hasSubscribed) {
            storeModelInstance.instance.startSubscriptions();
        }
    });

    onBeforeUnmount(() => {
        storeModelInstance.count--;
        if (storeModelInstance.count === 0 && storeModelInstance.instance) {
            storeModelInstance.instance.destroy();
            storeModelInstance.instance = null;
        }
    });
    onServerPrefetch(() => {
        return storeModelInstance.instance?.prefetch();
    });

    return storeModelInstance.instance as T;
}

export function install(VueLibrary: VueConstructor) {
    VueLibrary.mixin({
        beforeCreate() {
            // 为了适配小程序，$store去原型上找一下
            const store = this.$root.$options.apolloStore
                || this.$root.$options.apolloStore
                || this.apolloStore;
            const models = this.$options.models;
            if (!models || !store) {
                return;
            }

            Object.keys(models).forEach((key) => {
                const modelCtor = models[key];
                const storeModelInstance = store.registerModel(modelCtor);
                if (!storeModelInstance.count) {
                    const instance = new storeModelInstance.constructor(
                        this.$root,
                        store,
                    );
                    instance.init();
                    storeModelInstance.instance = instance
                }
                storeModelInstance.count++;

                Object.defineProperty(this, key, {
                    get: () => storeModelInstance.instance,
                    configurable: true,
                });
            });
            this.$nextTick(() => {
                Object.keys(models).forEach(key => {
                    // TODO这里可能涉及多次订阅导致性能问题，后面把subscription相关逻辑干了也许就解了……
                    // 先临时通过hasSubscribed来判断
                    // @ts-ignore
                    if (!this.$isServer && this[key] && !this[key].hasSubscribed) {
                        // @ts-ignore
                        this[key].startSubscriptions();
                    }
                });
            });
        },
        serverPrefetch() {
            if (!this.$options.models) {
                return Promise.resolve();
            }
            const promiseList = Object.keys(this.$options.models).map(key => {
                const store = this.$root.$options.apolloStore
                    || this.$root.$options.apolloStore
                    || this.apolloStore;
                if (!store) {
                    return;
                }
                const model = store.getModelInstance(this.$options.models[key]);
                if (!model || !model.instance) {
                    return;
                }
                return model.instance.prefetch();
            }).filter(t => typeof t !== 'undefined') as Promise<any>[];
            return Promise.all(promiseList).then();
        },
        beforeDestroy(this: Vue) {
            const store = this.$root.$options.apolloStore
                || this.$root.$options.apolloStore
                || this.apolloStore;
            const models = this.$options.models;
            if (!models || !store) {
                return;
            }
            Object.defineProperty(this, '$client', {
                get: () => null,
            });
            Object.keys(models).forEach((key) => {
                const modelCtor = models[key];
                const storeModelInstance = store.getModelInstance(modelCtor);
                if (!storeModelInstance) {
                    return;
                }
                storeModelInstance.count--;
                if (storeModelInstance.count === 0 && storeModelInstance.instance) {
                    storeModelInstance.instance.destroy();
                    storeModelInstance.instance = null;
                }
                Object.defineProperty(this, key, {
                    get: () => null,
                    configurable: true,
                });
            });
        },
    });
}
