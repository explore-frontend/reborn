import Vue from 'vue';
import xstream, { Subscription } from 'xstream';

import Store from './store';
import Query from './query';
import { StreamsObj, VueApolloModelQueryOptions, apolloClient } from './types';
import { getInitialStateFromQuery } from './utils/graphql';
import { defineReactive } from './install';

const skipProperty = ['models', 'subscriptions'];

export class BaseModel {
    protected readonly $vm: Vue;
    private readonly $store: Store;

    readonly $client: apolloClient;

    private subs: Subscription[] = [];

    $apollo: {
        [key: string]: Query;
    } = {};

    subscriptions?: () => StreamsObj | StreamsObj;

    private $streamsFromApollo: StreamsObj = {};
    private $streamsFromSubscriptions: StreamsObj = {};
    $streamsFromState: StreamsObj = {};

    // 因为根组件在SSR时候会优先触发created，路由上的不会，所以需要判断一下避免重复初始化
    // 后续考虑改一下设计
    private inited = false;

    [key: string]: any;

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

    init() {
        if (this.inited) {
            return;
        }
        this.initState();
        this.initDependencyModel();
        this.initApolloQuery();
        this.initSubscriptions();

        this.inited = true;
    }

    private initState() {
        makeModelReactive(this);
    }

    private initDependencyModel() {
        if (!this.models) {
            return;
        }

        Object.keys(this.models).forEach((key) => {
            Object.defineProperty(this, key, {
                // TODO这里可能获取不到
                get: () => this.$store.getModelInstance(this.models[key]).instance,
                configurable: true,
            });
        });
    }

    private initApolloQuery() {
        const apolloQuery: string[] = [];
        let proto = Object.getPrototypeOf(this);
        while (proto !== Object.prototype) {
            const keys = Object.keys(proto).filter(
                key => proto[key] && proto[key]._type === 'apolloQuery'
            )
            apolloQuery.push(...keys);
            proto = Object.getPrototypeOf(proto);
        }
        if (!apolloQuery.length) {
            return;
        }

        apolloQuery.forEach(queryKey => {
            const query = new Query(
                queryKey,
                this[queryKey].detail,
                this.$client,
                // TODO 这块貌似产生了循环依赖……后面再看怎么弄吧
                this,
                this.$vm,
            );
            this.$apollo[queryKey] = query;

            const initialQueryState = getInitialStateFromQuery(this[queryKey].detail);
            defineReactive(this, queryKey, initialQueryState);

            if (typeof window === 'undefined') {
                return;
            }

            const initialData = query.currentResult();
            if (!initialData.loading) {
                this[queryKey] = initialData.data;
            }

            // TODO后面再改
            this.$streamsFromApollo[queryKey + '$'] = query.observable.debug(({data}: {data: any}) => {
                this[queryKey] = data;
            });
        });
    }

    // 好像还没有开始用？？？
    private initSubscriptions() {
        if (!this.subscriptions) {
            return;
        }
        // TODO 这里需要判断一下uniq
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
        // Object.keys(this.models).forEach((key) => {
        //     Object.defineProperty(this, key, {
        //         get: () => null,
        //         configurable: true,
        //     });
        // });
    }
}

function makeModelReactive(model: BaseModel) {
    Object.keys(model).forEach(key => {
        // 以 $ 或者 _ 开头的为私有属性，不进行处理
        if (key.startsWith('$') || key.startsWith('_') || key.endsWith('$') || skipProperty.includes(key)) {
            return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(model, key) || {};

        // 方法也不进行处理
        if (typeof descriptor.value === 'function') {
            return;
        }

        makeObservable(model, key);
    });
}

function makeObservable(model: BaseModel, key: string) {
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

    defineReactive(model, key, initialValue, () => {
        Promise.resolve().then(() => {
            if (observerListener) {
                observerListener.next(model[key]);
            }
        });
    });
}

export function apolloQuery(queryDefine: VueApolloModelQueryOptions) {
    return function createObservable(constructor: BaseModel, key: string) {
        // TODO这货不应该这么处理，queryDefine后续也许还有用，应该单独找一个地方存起来……
        constructor[key] = {
            _type: 'apolloQuery',
            detail: queryDefine,
        };
    };
}
