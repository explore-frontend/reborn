import Vue from 'vue';
import xstream, {Stream} from 'xstream';

import Store from './store';
import Query from './query';
import {StreamsObj, VueApolloModelQueryOptions, apolloClient} from './types';
import {getInitialStateFromQuery} from './utils/graphql';
import {defineReactive} from './install';

const skipProperty = ['models', 'subscriptions'];

export class BaseModel {
    protected readonly $vm: Vue;
    private readonly $store: Store;

    readonly $client: apolloClient;

    $apollo: {
        [key: string]: Query;
    } = {};

    // 依赖的其他 model
    models: string[] = [];

    subscriptions?: () => StreamsObj | StreamsObj;

    private $streamsFromApollo: StreamsObj = {};
    private $streamsFromSubscriptions: StreamsObj = {};
    $streamsFromState: StreamsObj = {};
    $models: {[key: string]: any} = {};

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
        this.initState();
        this.initDependencyModel();
        this.initApolloQuery();
        this.initSubscriptions();

        this.vm = this.$vm;
    }

    private initState() {
        makeModelReactive(this);
    }

    private initDependencyModel() {
        if (!this.models) {
            return;
        }

        this.models.forEach(modelName => {
            Object.defineProperty(this.$models, modelName, {
                get: () => {
                    return this.$store.modelMap[modelName].instance;
                },
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
            this.$streamsFromSubscriptions[key].addListener({
                next: val => {
                    this[rKey] = val;
                },
            });
        });
    }

    startSubscriptions() {
        // TODO: 后面再看怎么样订阅是合理的，目前为了保证顺序……先上面搞副作用去了
        Object.keys(this.$streamsFromApollo).forEach(key => {
            const rKey = key.lastIndexOf('$') === key.length - 1 ? key.slice(0, -1) : key;
            this.$streamsFromApollo[key].addListener({});
        });
    }

    prefetch() {
        return Promise.all(Object.values(this.$apollo).map(query => query.prefetch()));
    }

    destroy() {
        Object.keys(this.$streams).forEach(key => {
            const stream: Stream<any> = this.$streams[key];
            // TODO 关于注销相关的事情，这里看看后续是不是需要extension一下Stream……
            // 因为没有直接removeListener/unsubscribe方法，所以只能先这么弄一下
            // @ts-ignore
            stream._ils.forEach(listener => {
                // TODO 同上
                // @ts-ignore
                stream.removeListener(listener);
            });
        });

        Object.keys(this.$apollo).forEach(key => {
            this.$apollo[key].destroy();
        });
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
        constructor[key] = {
            _type: 'apolloQuery',
            detail: queryDefine,
        };
    };
}
