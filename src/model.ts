import Vue from 'vue';
import xstream, { Subscription } from 'xstream';

import Store from './store';
import Query from './apollo/query';
import Mutation from './apollo/mutation';
import {
    StreamsObj,
    VueApolloModelQueryOptions,
    apolloClient,
    VueApolloModelMutationOptions,
} from './types';
import { defineReactive } from './install';
import 'reflect-metadata';

const skipProperty = [
    'userProperties',
    'models',
    'addProperty',
    'collectProperties',
    'subscriptions',
    'subs',
    'autoBind',
    'init',
    'initState',
    'initDependencyModel',
    'initApolloDesc',
    'initSubscriptions',
    'startSubscriptions',
    'prefetch',
    'destroy',
];

function isSkipProperty(key: string) {
    return key.startsWith('$')
        || key.startsWith('_')
        || key.endsWith('$')
        || skipProperty.includes(key);
}

interface VueApolloModelMetadata {
    type: 'apolloQuery' | 'apolloMutation' | 'restQuery' | 'restMutation';
    detail: any;
}

interface VueApolloModelMetadata {
    type: 'apolloQuery' | 'apolloMutation' | 'restQuery' | 'restMutation';
    detail: any;
}

export class BaseModel {
    protected readonly $vm: Vue;
    private readonly $store: Store;
    readonly $client: apolloClient;
    private subs: Subscription[] = [];
    private userProperties: Array<keyof this> = [];

    $apollo: {[key: string]: Query<any>;} = {};
    private $streamsFromApollo: StreamsObj = {};
    private $streamsFromSubscriptions: StreamsObj = {};
    $streamsFromState: StreamsObj = {};

    get $streams() {
        return {
            ...this.$streamsFromApollo,
            ...this.$streamsFromSubscriptions,
            ...this.$streamsFromState,
        };
    }

    constructor(client: apolloClient, vm: Vue, store: Store) {
        this.$vm = vm;
        this.$store = store;
        this.$client = client;
    }

    private autoBind() {
        for (const key of this.userProperties) {
            if (typeof this[key] === 'function') {
                // @ts-ignore
                this[key] = this[key].bind(this);
            }
        }
    }

    init() {
        this.collectProperties();
        this.initState();
        this.initDependencyModel();
        this.initApolloDesc();
        this.initSubscriptions();
        this.autoBind();
    }

    private addProperty(keys: Array<keyof this>) {
        for (const key of keys) {
            if (!isSkipProperty(key as string)) {
                this.userProperties.push(key);
            }
        }
    }

    private collectProperties() {
        // 处理自身属性
        this.addProperty(Object.keys(this) as Array<keyof this>)
        // 处理原型链
        let proto = Object.getPrototypeOf(this);
        while (proto && proto !== Object.prototype) {
            this.addProperty(Object.keys(proto) as Array<keyof this>)
            proto = Object.getPrototypeOf(proto);
        }
    }

    private initState() {
        for (const key of this.userProperties) {
            if (typeof this[key] !== 'function') {
                makeObservable(this, key);
            }
        }
    }

    private initDependencyModel() {
        // @ts-ignore
        if (!this.models) {
            return;
        }
        // @ts-ignore
        Object.keys(this.models).forEach((key) => {
            Object.defineProperty(this, key, {
                // TODO这里可能获取不到
                // @ts-ignore
                get: () => this.$store.getModelInstance(this.models[key]).instance,
                configurable: true,
            });
        });
    }

    private initApolloMutation(key: keyof this, info: VueApolloModelMetadata) {
        const mutation = new Mutation(
            key as string,
            info.detail,
            this.$client,
            this,
            this.$vm,
        );
        const mutate = mutation.mutate.bind(mutation);
        Object.defineProperty(this, key, {
            value: {
                get data() {
                    return mutation.data;
                },
                get loading() {
                    return mutation.loading;
                },
                get mutate() {
                    return mutate;
                },
            },
            writable: false,
            configurable: false,
            enumerable: true,
        });
    }

    private initApolloQuery(key: string, info: VueApolloModelMetadata) {
        const query = new Query(
            key,
            info.detail,
            this.$client,
            this,
            this.$vm,
        );
        this.$apollo[key] = query;
        // TODO后面再改
        this.$streamsFromApollo[key + '$'] = query.observable;
    }

    private initApolloDesc() {
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', this, 'decoratorKeys') || [];
        if (!decoratorKeys.length) {
            return;
        }
        for (const key of decoratorKeys) {
            const info: VueApolloModelMetadata = Reflect.getMetadata('vueApolloModel', this, key);
            switch (info.type) {
                case 'apolloQuery':
                    this.initApolloQuery(key, info);
                    break;
                case 'apolloMutation':
                    this.initApolloMutation(key, info);
                    break;
                // case 'restQuery':
                // case 'restMutation':
            }
        }
    }

    private initSubscriptions() {
        // @ts-ignore
        if (!this.subscriptions) {
            return;
        }
        // TODO 这里需要判断一下uniq
        // @ts-ignore
        const $streams = typeof this.subscriptions === 'function' ? this.subscriptions() : this.subscriptions;

        Object.assign(this.$streamsFromSubscriptions, $streams);
        Object.freeze(this.$streamsFromSubscriptions);

        Object.keys(this.$streamsFromSubscriptions).forEach(key => {
            const rKey = key.lastIndexOf('$') === key.length - 1 ? key.slice(0, -1) : key;
            if (!(rKey in this)) {
                defineReactive(this, rKey, null);
            }
            const sub = this.$streamsFromSubscriptions[key].subscribe({
                next: val => {
                    // @ts-ignore
                    this[rKey] = val;
                },
            });
            this.subs.push(sub);
        });
    }

    startSubscriptions() {
        // TODO: 后面再看怎么样订阅是合理的，目前为了保证顺序……先上面搞副作用去了
        Object.keys(this.$streamsFromApollo).forEach(key => {
            const sub = this.$streamsFromApollo[key].subscribe({});
            this.subs.push(sub);
        });
    }

    prefetch() {
        const prefetchList = Object.keys(this.$apollo)
            .map(key => this.$apollo[key].prefetch());
        return Promise.all(prefetchList);
    }

    destroy() {
        this.subs.forEach(sub => sub.unsubscribe());

        Object.keys(this.$apollo).forEach(key => {
            this.$apollo[key].destroy();
        });
    }
}

function makeObservable<T extends BaseModel>(model: T, key: keyof T) {
    let observerListener: any;
    const initialValue = model[key];

    model.$streamsFromState[key + '$'] = xstream.create({
        start(listener) {
            observerListener = listener;
            observerListener.next(initialValue);
        },
        stop() {
            observerListener = null;
        },
    });

    defineReactive(model, key as string, initialValue, () => {
        Promise.resolve().then(() => {
            if (observerListener) {
                observerListener.next(model[key]);
            }
        });
    });
}

export function apolloQuery(queryDefine: VueApolloModelQueryOptions) {
    // TODO推导类型写不出来了= =
    return function createApolloQuery(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata = {
            type: 'apolloQuery',
            detail: queryDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    };
}
export function apolloMutation(mutationDefine: VueApolloModelMutationOptions) {
    return function createApolloMutation(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata = {
            type: 'apolloMutation',
            detail: mutationDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    }
}

export function restQuery(restQueryDefine: any) {
    return function createRestQuery(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata = {
            type: 'restQuery',
            detail: restQueryDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    }
}
export function restMutation(restMutationDefine: any) {
    return function createRestQuery(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata = {
            type: 'restMutation',
            detail: restMutationDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    }
}
