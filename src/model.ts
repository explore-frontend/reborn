import Vue from 'vue';
import xstream, { Subscription } from 'xstream';

import Store from './store';
import { Query } from './apollo/query';
import { Mutation } from './apollo/mutation';
import {
    StreamsObj,
    VueApolloModelQueryOptions,
    VueApolloModelMutationOptions,
    GraphqlClients,
    Constructor,
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
    'initApolloDesc',
    'initSubscriptions',
    'startSubscriptions',
    'prefetch',
    'destroy',
    'apolloQueries',
];

function isSkipProperty(key: string) {
    return key.startsWith('$')
        || key.startsWith('_')
        || key.endsWith('$')
        || skipProperty.includes(key);
}

interface VueApolloModelMetadata<T> {
    type: 'apolloQuery' | 'apolloMutation' | 'restQuery' | 'restMutation';
    detail: VueApolloModelQueryOptions<T> | VueApolloModelMutationOptions<T>;
}

export class BaseModel {
    protected readonly $vm: Vue;
    private readonly $store: Store;
    private readonly $clients: GraphqlClients;
    private subs: Subscription[] = [];
    private userProperties: Array<keyof this> = [];
    private apolloQueries: Array<Query<any, any>> = [];
    hasSubscribed = false;

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

    constructor(
        clients: GraphqlClients,
        vm: Vue,
        store: Store,
    ) {
        this.$vm = vm;
        this.$store = store;
        this.$clients = clients;
    }

    private autoBind() {
        for (const key of this.userProperties) {
            if (typeof this[key] === 'function') {
                this[key] = (this[key] as unknown as Function).bind(this);
            }
        }
    }

    init<ModelType extends BaseModel>() {
        this.collectProperties();
        this.initState();
        this.initApolloDesc<ModelType>();
        this.initSubscriptions();
        this.autoBind();
        // TODO因为apollo的缓存有点迷，临时性还是先把$clients放出来了，但是不推荐使用……
        defineReactive(this, '$clients', this.$clients)
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

    getDependencyModelFromStore<T extends BaseModel>(Ctor: Constructor<T>) {
        const storeModelInstance = this.$store.getModelInstance(Ctor);
        return storeModelInstance?.instance;
    }

    private initApolloMutation<ModelType>(key: keyof this, options: VueApolloModelMutationOptions<ModelType>) {
        const client = options.client && options.client in this.$clients.clients
            ? this.$clients.clients[options.client]
            : this.$clients.defaultClient;
        const mutation = new Mutation(
            key as string,
            options,
            client,
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
                get error() {
                    return mutation.error;
                },
            },
            writable: false,
            configurable: false,
            enumerable: true,
        });
    }

    private initApolloQuery<ModelType extends BaseModel>(
        key: string,
        options: VueApolloModelQueryOptions<ModelType>,
    ) {
        const client = options.client && options.client in this.$clients.clients
            ? this.$clients.clients[options.client]
            : this.$clients.defaultClient;
        const query = new Query<any, ModelType>(
            key,
            options,
            client,
            // @ts-ignore
            this,
            this.$vm,
        );
        const refetch = query.refetch.bind(query);
        const fetchMore = query.fetchMore.bind(query);
        Object.defineProperty(this, key, {
            value: {
                get data() {
                    return query.data;
                },
                get loading() {
                    return query.loading;
                },
                get refetch() {
                    return refetch;
                },
                get fetchMore() {
                    return fetchMore;
                },
                get error() {
                    return query.error;
                },
            },
            writable: false,
            configurable: false,
            enumerable: true,
        });
        this.apolloQueries.push(query);
        // TODO后面再改
        this.$streamsFromApollo[key + '$'] = query.observable;
    }

    private initApolloDesc<ModelType extends BaseModel>() {
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', this, 'decoratorKeys') || [];
        if (!decoratorKeys.length) {
            return;
        }
        for (const key of decoratorKeys) {
            const info: VueApolloModelMetadata<ModelType> = Reflect.getMetadata('vueApolloModel', this, key);
            if (!info) {
                continue;
            }
            switch (info.type) {
                case 'apolloQuery':
                    this.initApolloQuery<ModelType>(key, info.detail as VueApolloModelQueryOptions<ModelType>);
                    break;
                case 'apolloMutation':
                    this.initApolloMutation<ModelType>(key, info.detail as VueApolloModelMutationOptions<ModelType>);
                    break;
            }
        }

        // 延迟初始化，保证query间依赖
        if (this.apolloQueries.length && !this.$vm.$isServer) {
            this.apolloQueries.forEach(query => query.init());
        }
    }

    private initSubscriptions() {
        // TODO subscriptions的形式后面还需要改变
        // @ts-ignore
        if (!this.subscriptions) {
            return;
        }
        // TODO 这里需要判断一下uniq
        // TODO subscriptions的形式后面还需要改变
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
                    // TODO subscriptions的形式后面还需要改变
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
        this.hasSubscribed = true;
    }

    prefetch() {
        const prefetchList = this.apolloQueries.map(query => query.prefetch());
        return Promise.all(prefetchList);
    }

    destroy() {
        this.subs.forEach(sub => sub.unsubscribe());
        this.apolloQueries.forEach(query => query.destroy());
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

export function apolloQuery<T extends BaseModel>(queryDefine: VueApolloModelQueryOptions<T>) {
    // TODO推导类型写不出来了= =
    return function createApolloQuery(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata<T> = {
            type: 'apolloQuery',
            detail: queryDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    };
}
export function apolloMutation<T extends BaseModel>(mutationDefine: VueApolloModelMutationOptions<T>) {
    return function createApolloMutation(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata<T> = {
            type: 'apolloMutation',
            detail: mutationDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    }
}

export function restQuery<T extends BaseModel>(restQueryDefine: any) {
    return function createRestQuery(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata<T> = {
            type: 'restQuery',
            detail: restQueryDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    }
}

export function restMutation<T extends BaseModel>(restMutationDefine: any) {
    return function createRestQuery(constructor: any, key: string) {
        const descriptor: VueApolloModelMetadata<T> = {
            type: 'restMutation',
            detail: restMutationDefine,
        };
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    }
}
