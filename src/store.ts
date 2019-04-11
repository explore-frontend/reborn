import Vue from 'vue';
import serialize from 'serialize-javascript';

import {modelConstructorMap} from './consts';
import {BaseModelConstructor, ModelMap, apolloClient} from './types';
import {BaseModel} from './model';
import {createOldVueModel} from '@/install';

export default class Store {
    modelMap: ModelMap = {};
    graphqlClient: apolloClient;

    constructor(graphqlClient: apolloClient) {
        this.graphqlClient = graphqlClient;
    }

    prefetch(names: string[], app: Vue) {
        const promiseList = names.map(name => {
            const constructor = modelConstructorMap[name];

            if (!this.modelMap[name] && typeof constructor === 'function') {
                const instance = new constructor(this.graphqlClient, app, this);
                this.modelMap[name] = {
                    constructor,
                    instance,
                    count: 1,
                };
            }

            if (this.modelMap[name] && this.modelMap[name].instance) {
                const instance = this.modelMap[name].instance;
                if (instance instanceof BaseModel) {
                    instance.init();
                    return instance.prefetch();
                }
            }

            return Promise.resolve(undefined);
        });
        return Promise.all(promiseList);
    }

    // TODO这货先放在这里滥竽充数了……
    serialize() {
        return Object.keys(this.modelMap).reduce((str: string, name) => {
            const val = this.modelMap[name].instance;
            if (val.$data) {
                return str + `window.VUE_MODEL_INIT_STATE['${name}']=${serialize(val.$data)};`;
            }
            return str;
        }, 'window.VUE_MODEL_INIT_STATE = {};');
    }

    initModels(models: string[]) {
        const instances = models.map(name => {
            const constructor = modelConstructorMap[name];

            if (!this.modelMap[name] && typeof constructor !== 'function') {
                const instance = createOldVueModel({
                    // @ts-ignore
                    ...constructor,
                    // @ts-ignore
                    store: this,
                });
                this.modelMap[name] = {
                    constructor,
                    // @ts-ignore
                    instance,
                    count: 1,
                };
                return instance;
            }
            return this.modelMap[name] ? this.modelMap[name].instance : {};
        });

        return models.reduce((map, name, index) => {
            map[name] = instances[index];
            return map;
        }, {} as any);
    }

    replaceState(initState: any) {
        // @ts-ignore
        if (this.hasInited) {
            return;
        }
        // @ts-ignore
        Object.keys(this.modelMap).forEach(key => {
            // @ts-ignore
            Object.assign(this.modelMap[key].instance, initState[key]);
        });
        // @ts-ignore
        this.hasInited = true;
    }

    // TODO
    exportStates() {
        const options = {
            globalName: '__APOLLO_STATE__',
            attachTo: 'window',
        };

        const states = {
            defaultClient: this.graphqlClient.cache.extract(),
        };

        return `${options.attachTo}.${options.globalName} = ${JSON.stringify(states)};`;
    }

    static getModelConstructor(name: string) {
        const constructor = modelConstructorMap[name];
        if (!constructor) {
            throw new Error(`The Model "${name}" has not been registered`);
        }
        return constructor;
    }
}

export function registerModel<T extends BaseModelConstructor>(modelContructor: T) {
    // TODO 后面这块需要全部干掉，是应对老Model的
    // @ts-ignore
    if (modelContructor.data && modelContructor.namespace) {
        const registedModel = modelConstructorMap[modelContructor.namespace];
        if (!registedModel) {
            modelConstructorMap[modelContructor.namespace] = modelContructor;
        } else if (registedModel.constructor !== modelContructor) {
            throw new Error(`The same namespace "${modelContructor.namespace}" has been registered`);
        }
        return modelContructor;
    }

    // TODO 这里往上的
    const registeredModel = modelConstructorMap[modelContructor.namespace];
    if (!registeredModel) {
        modelConstructorMap[modelContructor.namespace] = modelContructor;
    } else if (registeredModel.constructor !== modelContructor) {
        throw new Error(`The same namespace "${modelContructor.namespace}" has been registered`);
    }
    return modelContructor;
}

export function clearModels() {
    Object.keys(modelConstructorMap).forEach(key => delete modelConstructorMap[key]);
}
