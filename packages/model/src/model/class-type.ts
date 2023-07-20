import type { Constructor, ModelCotrInfo, ModelMetadata } from './types';
import type { RebornClient } from '../clients';
import type { GetModelInstance, Store } from '../store';

import {
    createRestMutation,
    createGQLMutation,
    createGQLQuery,
    createRestQuery,
} from '../operations';

import { getRootStore, MODE } from '../const';
import { computed, reactive, getCurrentInstance } from 'vue';
import { useStatus } from '../operations/status';

function registerProperty(obj: any, key: string, value: any) {
    Object.defineProperty(obj, key, {
        value,
        writable: false,
        configurable: false,
        enumerable: true,
    });
}

type DecoratorInfoList = Array<{
    key: string;
    meta: ModelMetadata;
}>

type RebornConstructor = {
    rebornDecorators: DecoratorInfoList;
    prototype: {
        constructor: RebornConstructor;
    }
}

type RebornDecorators = {
    constructor: RebornConstructor;
}

function getDecoratorList<T extends RebornDecorators>(instance: T) {
    const result: DecoratorInfoList = [];

    let cotr: RebornConstructor | Object = instance.constructor;
    while (cotr !== Object) {
        const rebornDecorators = (cotr as RebornConstructor).rebornDecorators;
        if (rebornDecorators) {
            result.push(...rebornDecorators);
        }
        cotr = Object.getPrototypeOf((cotr as RebornConstructor).prototype).constructor;
    }

    return result;
}

function initRebornDesc<T>(
    instance: T,
    instanceAccessor: Partial<T>,
    decoratorList: DecoratorInfoList,
    store: Store,
    rebornClient: RebornClient,
) {
    const queryList = [];
    const vm = getCurrentInstance()!;

    for (const item of decoratorList) {
        const { key, meta } = item;

        if (meta.type.startsWith('gql') && !rebornClient.gql) {
            throw new Error('Before use an gqlQuery / gqlMutation, you must register "GQL" client first');
        }
        if (meta.type.startsWith('rest') && !rebornClient.rest) {
            throw new Error('Before use an restQuery / restMutation, you must register "REST" client first');
        }

        if (meta.type.endsWith('Mutation')) {
            let mutation: ReturnType<typeof createRestMutation | typeof createGQLMutation>;
            if (meta.type === 'gqlMutation') {
                mutation = createGQLMutation<T, any>(
                    meta.detail,
                    instance as unknown as T,
                    vm.proxy!.$route,
                    rebornClient.gql,
                );
            } else if (meta.type === 'restMutation') {
                mutation = createRestMutation<T, any>(
                    meta.detail,
                    instance as unknown as T,
                    vm.proxy!.$route,
                    rebornClient.rest,
                )
            }
            const value = {
                get data() {
                    return mutation.info.data;
                },
                get loading() {
                    return mutation.info.loading;
                },
                get mutate() {
                    return mutation.mutate.bind(mutation);
                },
                get error() {
                    return mutation.info.error;
                },
            };
            registerProperty(instanceAccessor, key, value);
        } else {
            let query!: ReturnType<typeof createGQLQuery | typeof createRestQuery>;
            if (meta.type === 'gqlQuery') {
                query = createGQLQuery<T, any>(
                    meta.detail,
                    instance as unknown as T,
                    vm.proxy!.$route,
                    store.hydrationStatus,
                    rebornClient.gql,
                );
            } else if (meta.type === 'restQuery') {
                query = createRestQuery<T, any>(
                    meta.detail,
                    instance as unknown as T,
                    vm.proxy!.$route,
                    store.hydrationStatus,
                    rebornClient.rest,
                )
            }

            const status = useStatus(query.info);

            const value = {
                get data() {
                    return query.info.data;
                },
                get loading() {
                    return query.info.loading;
                },
                get refetch() {
                    return query.refetch.bind(query);
                },
                get fetchMore() {
                    return query.fetchMore.bind(query);
                },
                get error() {
                    return query.info.error;
                },
                get status() {
                    return status.value;
                },
            };
            queryList.push(query);
            registerProperty(instanceAccessor, key, value);
        }
    }

    return queryList;
}

const SKIP_PROPERTIES = [
    'constructor',
];

type PropertyMeta<T = string> = {
    key: T;
    type: 'getter';
    get?: Function;
    set?: Function;
} | {
    key: T;
    type: 'function' | 'other';
    value?: any;
};

function collectProperty<T>(target: any) {
    const properties: Array<PropertyMeta<T>> = [];

    Object.getOwnPropertyNames(target).forEach(key => {
        if (SKIP_PROPERTIES.indexOf(key) >= 0) {
            return;
        }

        const desc = Object.getOwnPropertyDescriptor(target, key)!;

        if (desc.get) {
            properties.push({
                key: key as unknown as T,
                type: 'getter',
                get: desc.get,
                set: desc.set,
            });
        } else if (typeof desc.value === 'function') {
            properties.push({
                key: key as unknown as T,
                type: 'function',
                value: desc.value,
            });
        } else {
            properties.push({
                key: key as unknown as T,
                type: 'other',
                value: desc.value,
            });
        }
    });

    return properties;
}


function getDataFactory<T>(ctor: Constructor<T>) {
    return () => {
        const original = new ctor();

        const plain: Partial<T> = {
            ...original,
        };

        const reactiveData = reactive(plain) as Partial<T>;
        const modelAccessor: Partial<T> = {};

        const keys = Object.getOwnPropertyNames(reactiveData)
        keys.forEach(key => {
            Object.defineProperty(modelAccessor, key, {
                get: () => reactiveData[key as keyof typeof reactiveData],
                set: value => {
                    reactiveData[key as keyof typeof reactiveData] = value;
                },
            });

            Object.defineProperty(original, key, {
                get: () => modelAccessor[key as keyof typeof modelAccessor],
                set: value => {
                    modelAccessor[key as keyof typeof modelAccessor] = value;
                },
            });
        });

        return {
            reactiveData,
            original,
            modelAccessor,
        };
    }
}

function getPropertyMetaList<T>(ctor: Constructor<T>) {
    const properties: Array<PropertyMeta<keyof T>> = []
    // 处理原型链
    let proto = ctor.prototype;
    while (proto && proto !== Object.prototype) {
        properties.push(...collectProperty<keyof T>(proto));

        proto = Object.getPrototypeOf(proto);
    }

    return properties;
}

function generateProtoData<T>(ctor: Constructor<T>) {
    return (
        accessor: Partial<T>,
    ) => {
        const properties = getPropertyMetaList<T>(ctor);

        for (const item of properties) {
            if (item.type === 'function') {
                Object.defineProperty(accessor, item.key, {
                    get() {
                        return item.value.bind(accessor);
                    },
                });
            } else if (item.type === 'getter') {
                const { get = () => {}, set } = item;
                // 使用computed作为缓存，避免getter触发多次
                const computedValue = computed({
                    get: () => {
                        return get.call(accessor);
                    },
                    set: (val: any) => {
                        if (set) {
                            set.call(accessor, val);
                        }
                    },
                });

                const descriptors: PropertyDescriptor = {
                    enumerable: true,
                    get() {
                        return computedValue.value;
                    },
                };

                if (set) {
                    descriptors.set = (val) => {
                        computedValue.value = val;
                    };
                }

                Object.defineProperty(accessor, item.key, descriptors);
            }
        }
    }
}

export abstract class BaseModel {
    protected getModelInstance!: GetModelInstance;
}

export function createModelFromClass<T>(ctor: Constructor<T>): ModelCotrInfo<T> {
    const data = getDataFactory<T>(ctor);
    const protoData = generateProtoData<T>(ctor);

    return {
        type: 'ClassModel',
        cotr: (client?: RebornClient) => {
            if (!client) {
                throw new Error('no client has been set before you use class mode model')
            }
            const {
                original,
                reactiveData: model,
                modelAccessor,
            } = data();

            const store = getRootStore().store;
            const decoratorList = getDecoratorList(original as unknown as RebornDecorators);

            const queryList = decoratorList.length
                ? initRebornDesc(
                    model,
                    modelAccessor,
                    decoratorList,
                    store,
                    client
                )
                : [];

            protoData(modelAccessor);

            function destroy() {
                if (queryList) {
                    queryList.forEach(i => i.destroy());
                    queryList.length = 0
                }

                Object.defineProperty(modelAccessor, 'getModelInstance', {
                    get() {
                        return null
                    },
                    configurable: true,
                    enumerable: false,
                });
            }

            Object.defineProperty(modelAccessor, 'getModelInstance', {
                get() {
                    return store.getModelInstance
                },
                configurable: true,
                enumerable: false,
            });

            // 延迟初始化，保证query间依赖
            if (queryList.length && MODE !== 'SSR') {
                queryList.forEach(query => query.init());
            }

            function prefetch() {
                return Promise.all(queryList.map(query => query.refetch()));
            }

            return {
                model: modelAccessor as T,
                prefetch,
                destroy,
            };
        },
    };
}
