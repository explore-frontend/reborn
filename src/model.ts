import Vue from 'vue';
import xstream, { Subscription } from 'xstream';

import Store from './store';
import { ApolloQuery } from './apollo/query';
import { ApolloMutation } from './apollo/mutation';
import { RestQuery } from './rest/query';
import { RestMutation } from './rest/mutation';
import {
    StreamsObj,
    GraphqlClients,
    Constructor,
    VueApolloModelMetadata,
} from './types';
import { defineReactive } from './install';
import 'reflect-metadata';

const skipProperty = [
    'subscriptions',
    'subs',
    'init',
    'startSubscriptions',
    'prefetch',
    'destroy',
];

function isSkipProperty(key: string) {
    return key.startsWith('$')
        || key.startsWith('$$')
        || key.endsWith('$')
        || skipProperty.includes(key);
}

function getClient(clients: GraphqlClients, clientName?: string) {
    return clientName && clientName in clients.clients
        ? clients.clients[clientName]
        : clients.defaultClient;
}

function registerProperty(obj: any, key: string, value: any) {
    Object.defineProperty(obj, key, {
        value,
        writable: false,
        configurable: false,
        enumerable: true,
    });
}

export class BaseModel {
    protected readonly $vm: Vue;
    private readonly $store: Store;
    private subs: Subscription[] = [];
    private $$userProperties: Array<keyof this> = [];
    private $$apolloQueries: Array<ApolloQuery<any> | RestQuery<any>> = [];
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
        vm: Vue,
        store: Store,
    ) {
        this.$vm = vm;
        this.$store = store;
    }

    private $$autoBind() {
        for (const key of this.$$userProperties) {
            if (typeof this[key] === 'function') {
                this[key] = (this[key] as unknown as Function).bind(this);
            }
        }
    }

    init<ModelType extends BaseModel>() {
        this.$$collectProperties();
        this.$$initState();
        this.$$initApolloDesc<ModelType>();
        this.$$initSubscriptions();
        this.$$autoBind();
        // TODO因为apollo的缓存有点迷，临时性还是先把$clients放出来了，但是不推荐使用……
        defineReactive(this, '$clients', this.$store.graphqlClients)
    }

    private $$addProperty(keys: Array<keyof this>) {
        for (const key of keys) {
            if (!isSkipProperty(key as string)) {
                this.$$userProperties.push(key);
            }
        }
    }

    private $$collectProperties() {
        // 处理自身属性
        this.$$addProperty(Object.keys(this) as Array<keyof this>)
        // 处理原型链
        let proto = Object.getPrototypeOf(this);
        while (proto && proto !== Object.prototype) {
            this.$$addProperty(Object.keys(proto) as Array<keyof this>)
            proto = Object.getPrototypeOf(proto);
        }
    }

    private $$initState() {
        for (const key of this.$$userProperties) {
            if (typeof this[key] !== 'function') {
                makeObservable(this, key);
            }
        }
    }

    getModelInstanceFromStore<T extends BaseModel>(Ctor: Constructor<T>) {
        const storeModelInstance = this.$store.getModelInstance(Ctor);
        return storeModelInstance?.instance;
    }

    private initFromMetaData<T extends BaseModel>(
        key: string,
        options: VueApolloModelMetadata<T>,
    ) {
        if (options.type.endsWith('Mutation')) {
            let mutation: ApolloMutation<T> | RestMutation<T>;
            if (options.type === 'apolloMutation') {
                mutation = new ApolloMutation<T>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    getClient(this.$store.graphqlClients, options.detail.client),
                );
            } else if (options.type === 'restMutation') {
                mutation = new RestMutation<T>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    this.$store.request
                )
            }
            const value = {
                get data() {
                    return mutation.data;
                },
                get loading() {
                    return mutation.loading;
                },
                get mutate() {
                    return mutation.mutate.bind(mutation);
                },
                get error() {
                    return mutation.error;
                },
            };
            registerProperty(this, key, value);
        } else {
            let query!: ApolloQuery<T> | RestQuery<T>;
            if (options.type === 'apolloQuery') {
                query = new ApolloQuery<T>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    getClient(this.$store.graphqlClients, options.detail.client),
                );
            } else if (options.type === 'restQuery') {
                query = new RestQuery<T>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    this.$store.request,
                )
            }
            const value = {
                get data() {
                    return query.data;
                },
                get loading() {
                    return query.loading;
                },
                get refetch() {
                    return query.refetch.bind(query);
                },
                get fetchMore() {
                    return query.fetchMore.bind(query);
                },
                get error() {
                    return query.error;
                },
            };
            this.$$apolloQueries.push(query);
            // TODO后面再改
            this.$streamsFromApollo[key + '$'] = query.observable;
            registerProperty(this, key, value);
        }
    }

    private $$initApolloDesc<ModelType extends BaseModel>() {
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', this, 'decoratorKeys') || [];
        if (!decoratorKeys.length) {
            return;
        }
        for (const key of decoratorKeys) {
            const info: VueApolloModelMetadata<ModelType> = Reflect.getMetadata('vueApolloModel', this, key);
            if (!info) {
                continue;
            }
            this.initFromMetaData(key, info);
        }

        // 延迟初始化，保证query间依赖
        if (this.$$apolloQueries.length && !this.$vm.$isServer) {
            this.$$apolloQueries.forEach(query => query.init());
        }
    }

    private $$initSubscriptions() {
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
        const prefetchList = this.$$apolloQueries.map(query => query.prefetch());
        return Promise.all(prefetchList);
    }

    destroy() {
        this.subs.forEach(sub => sub.unsubscribe());
        this.$$apolloQueries.forEach(query => query.destroy());
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
