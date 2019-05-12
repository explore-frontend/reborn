import Vue, {VueConstructor} from 'vue';

let _Vue: VueConstructor;

export function defineReactive(obj: object, key: string, val?: any, customSetter?: (val?: any) => void, shallow?: boolean) {
    return _Vue.util.defineReactive(obj, key, val, customSetter, shallow);
}

export function createOldVueModel(options: object) {
    return new _Vue(options);
}

export default function install(VueLibrary: VueConstructor) {
    _Vue = VueLibrary;
    VueLibrary.mixin({
        async beforeCreate() {
            const store = this.$root.$options.store;
            const models = this.$options.models;
            if (!models || !store) {
                return;
            }

            // TODO后面看看要不要给塞到Vue的prototype上去
            Object.defineProperty(this, '$client', {
                get: () => store.graphqlClient,
                configurable: true
            });

            Object.keys(models).forEach((key) => {
                const modelCtor = models[key];
                const storeModelInstance = store.registerModel(modelCtor);
                if (!storeModelInstance.count) {
                    const instance = new storeModelInstance.constructor(store.graphqlClient, this.$root, store);
                    instance.init();
                    storeModelInstance.instance = instance
                }
                storeModelInstance.count++;
                if (key in this) {
                    throw new Error(`There has a duplex name ${key} on ${this.$vnode.tag}`)
                }

                Object.defineProperty(this, key, {
                    get: () => storeModelInstance.instance,
                    configurable: true,
                });
            });
            await this.$nextTick();

            Object.keys(models).forEach((key) => {
                if (!this.$isServer) {
                    // @ts-ignore
                    this[key].startSubscriptions();
                }
            });
        },
        async serverPrefetch() {
            if (!this.$options.models) {
                return;
            }
            const promiseList = Object.keys(this.$options.models).map(key => {
                const store = this.$root.$options.store;
                // @ts-ignore
                const model = store.getModelInstance(this.$options.models[key]);
                return model.instance.prefetch();
            });
            await Promise.all(promiseList);
        },
        beforeDestroy(this: Vue) {
            const store = this.$root.$options.store;
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
                storeModelInstance.count--;
                if (storeModelInstance.count === 0) {
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
