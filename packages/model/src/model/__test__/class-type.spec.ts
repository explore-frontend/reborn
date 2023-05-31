/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import {
    defineComponent,
    onMounted,
    watch,
    h,
    createApp,
    ref,
} from 'vue-demi';

import { createModelFromClass } from '../class-type';
import { createClient } from '../../clients';
import { INJECT_KEY } from '../../const';

import { CustomModel, CustomClassWithExtends } from './mock-models/class-type';

import 'unfetch/polyfill';

const restClient = createClient('REST', {
    method: 'get',
});

restClient.interceptors.response.use((params) => {
    // 改在这里mock了= =，原因：找不到靠谱的mock Response Header的方式
    if (params.config.url === '/query') {
        return {
            a: 1,
            b: 1,
        };
    }
    return params;
});

describe('transform model success', () => {
    it('transform class mode model', () => new Promise(resolve => {
        const div = document.createElement('div');
        const App = defineComponent({
            setup() {
                const modelDesc = createModelFromClass(CustomModel);
                const { model } = modelDesc.cotr({
                    rest: restClient,
                });

                const result = new CustomModel();
                watch(() => model.data, (t, o) => {
                    expect(o).toBe(undefined);
                    expect(t).toStrictEqual({
                        a: 1,
                        b: 1,
                    });
                    resolve(true);
                });

                onMounted(async () => {
                    expect(modelDesc.type).toEqual('ClassModel');
                    expect(model.b).toBe(result.b);
                    expect(model.c).toBe(result.c);
                    expect(model.data).toBe(undefined);

                    fetchMock.mockResponseOnce(JSON.stringify({
                        a: 1,
                        b: 1,
                    }));

                    model.add(10);
                    result.add(10);

                    expect(model.b).toBe(result.b);
                    expect(model.c).toBe(result.c);
                });
                return () => null;
            }
        });

        const app = createApp({
            // 手动mock一下
            provide: {
                [INJECT_KEY]: {
                    store: {
                        getModelInstance: vi.fn(),
                        addModel: vi.fn(),
                        removeModel: vi.fn(),
                        restore: vi.fn(),
                        exportStates: vi.fn(),
                        hydrationStatus: ref(0),
                    },
                    rebornClient: {
                        rest: restClient,
                    }
                },
            },
            render: () => h(App)
        });
        app.mount(div);
    }));

    it('transform class mode model with extends', () => new Promise(resolve => {
        const div = document.createElement('div');
        const App = defineComponent({
            setup() {
                const modelDesc = createModelFromClass(CustomClassWithExtends);
                const { model } = modelDesc.cotr({
                    rest: restClient,
                });

                const result = new CustomClassWithExtends();

                watch(() => model.data, (t, o) => {
                    expect(o).toBe(undefined);
                    expect(t).toStrictEqual({
                        a: 1,
                        b: 1,
                    });
                });

                onMounted(() => {
                    expect(modelDesc.type).toEqual('ClassModel');
                    expect(model.b).toBe(result.b);
                    expect(model.c).toBe(result.c);
                    expect(model.d).toBe(result.d);

                    model.add(10);
                    result.add(10);

                    expect(model.b).toBe(result.b);
                    expect(model.c).toBe(result.c);
                    expect(model.d).toBe(result.d);
                    resolve(true);
                });

                return () => null;
            }
        });

        const app = createApp({
            // 手动先mock一下
            provide: {
                [INJECT_KEY]: {
                    store: {
                        getModelInstance: vi.fn(),
                        addModel: vi.fn(),
                        removeModel: vi.fn(),
                        restore: vi.fn(),
                        exportStates: vi.fn(),
                        hydrationStatus: ref(0),
                    },
                    rebornClient: {
                        rest: restClient,
                    }
                },
            },
            render: () => h(App)
        });
        app.mount(div);
    }));
});
