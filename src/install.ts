import Vue, {VueConstructor} from 'vue';
import {modelConstructorMap} from './consts';
import {BaseModel} from './model';

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
        beforeCreate() {
            const store = this.$root.$options.store;
            const models = this.$options.models;
            if (!models || !store) {
                return;
            }

            this.$client = store.graphqlClient;
            models.forEach(async name => {
                this.$models = this.$models || {};

                if (!store.modelMap[name]) {
                    // TODO后面这块重新弄一下……
                    let instance;
                    if (typeof modelConstructorMap[name] === 'function') {
                        instance = new modelConstructorMap[name](store.graphqlClient, this.$root, store);
                        instance.init();
                    } else {
                        instance = new VueLibrary({
                            ...modelConstructorMap[name],
                            store: this.$root.$options.store,
                        });
                    }

                    // TODO就是这里往上
                    store.modelMap[name] = {
                        constructor: modelConstructorMap[name],
                        instance,
                        count: 1,
                    };
                } else {
                    store.modelMap[name].count++;
                }

                this.$models[name] = store.modelMap[name].instance;
                await this.$nextTick();
                // TODO后面这块重新弄一下……
                if (typeof modelConstructorMap[name] !== 'function') {
                    return;
                }
                // TODO就是这里往上
                if (!this.$isServer) {
                    (this.$models[name] as BaseModel).startSubscriptions();
                }
            });
        },
        beforeDestroy(this: Vue) {
            const store = this.$root.$options.store;
            const models = this.$options.models;
            if (!models || !store) {
                return;
            }
            models.forEach(async name => {
                store.modelMap[name].count--;
                if (store.modelMap[name].count === 0) {
                    // TODO后面这块整体重构
                    if (store.modelMap[name].instance.$data) {
                        store.modelMap[name].instance.$destroy();
                    } else {
                        (store.modelMap[name].instance as BaseModel).destroy();
                    }
                    // TODO从这里往上
                    delete store.modelMap[name];
                }
            });
        },
    });
}
