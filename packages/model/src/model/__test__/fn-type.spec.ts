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

import { createClient } from '../../clients';
import { createModelFromCA } from '../fn-type';
import { INJECT_KEY } from '../../const';

import {
    isLoadingState,
    isDoneState,
    isFetchMoreState,
    isRefreshErrorState,
    isLoadingLikeState,
    isDoneLikeState,
    isErrorLikeState,
} from '../../index';

import { MockModel, MockComposeModel } from './mock-models/fn-type';
import 'unfetch/polyfill'

const restClient = createClient('REST', {
    method: 'post',
    headers: {
        'content-type': 'application/x-www-form-urlencoded',
    },
    timeout: 10 * 1000,
});

let count = 0;

let composeCount = 0;
restClient.interceptors.request.use(data => {
    if (data.url === '/') {
        expect(data.timeout).toBe(5000);
        expect(data.headers?.['content-type']).toBe('application/x-www-form-urlencoded');
    } else {
        expect(data.timeout).toBe(10 * 1000);
        expect(data.headers?.['content-type']).toBe('application/json');
    }

    return data;
});

restClient.interceptors.response.use(({ data, config }) => {
    if (config.url === '/') {
        if (config.requestInit.body === 'mockData=error') {
            return Promise.reject(new DOMException('The request has been timeout'));
        } else {
            ++count;
            return {
                a: `${count}`,
                b: `${count}`,
            };
        }
    }

    if (config.url === '/test-compose') {
        ++composeCount;
        return {
            test: `${composeCount}`
        }
    }
    return data;
}, () => {

});

describe('transform model success', () => {
    it('transform fn type model', () => new Promise(resolve => {
        const div = document.createElement('div');
        const App = defineComponent({
            setup() {

                const params = createModelFromCA(MockModel);
                // TODO就是简单意思一下，实际mock在上头写的
                fetchMock.mockResponse(JSON.stringify({}));

                const { model } = params.cotr();

                expect(isLoadingLikeState(model.status.value)).toBe(true);
                expect(isLoadingState(model.status.value)).toBe(true);

                watch(() => model.info.data?.b, () => {
                    expect(isDoneState(model.status.value)).toBe(true);
                    expect(isDoneLikeState(model.status.value)).toBe(true);

                    expect(typeof model.info.data?.a).toBe('string');
                    expect(typeof model.data.value?.a).toBe('string');
                    if (count < 3) {
                        expect(model.info.data?.a).toBe(count + '');
                        expect(model.data.value?.a).toBe(count + '');

                        expect(model.info.data?.b).toBe(count + '');
                        expect(model.data.value?.b).toBe(count + '');
                        // 第二次变化
                        model.testVariables.value = '';
                    } else {
                        expect(model.info.data?.a).toBe('23');
                        expect(model.data.value?.a).toBe('23');

                        expect(model.info.data?.b).toBe('23');
                        expect(model.data.value?.b).toBe('23');
                    }
                    if (model.info.data?.a === '23') {
                        model.testVariables.value = 'error';
                    }
                });

                watch(() => model.info.error, () => {
                    if (model.info.error) {
                        expect(isRefreshErrorState(model.status.value)).toBe(true);
                        expect(isErrorLikeState(model.status.value)).toBe(true);
                        resolve(true);
                    }
                });

                onMounted(() => {
                    expect(typeof model.info.data).toBe('undefined');
                    expect(typeof model.data.value).toBe('undefined');
                    model.refetch();

                    setTimeout(() => {
                        model.testVariables.value = '123';
                    }, 100);

                    setTimeout(() => {
                        // 第三次变化
                        model.fetchMore({
                            mockData: '12',
                        });
                        expect(isFetchMoreState(model.status.value)).toBe(true);
                    }, 300);
                })
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
                        hydrationStatus: ref(2),
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


describe('transform model with compose success', () => {
    it('transform fn type model', () => new Promise(resolve => {
        const div = document.createElement('div');
        const App = defineComponent({
            setup() {

                const params = createModelFromCA(MockComposeModel);
                // TODO就是简单意思一下，实际mock在上头写的
                fetchMock.mockResponse(JSON.stringify({}));

                const { model } = params.cotr();

                watch(() => `${model.model.info.data?.b}-${model.info.data?.test}`, () => {
                    if (model.info.data?.test) {
                        expect(model.info.data?.test).toBe('1');
                        expect(model.data.value?.test).toBe('1');
                    }
                    // TODO此处是按照执行时序手动控制的……后面再想想怎么优雅的测试吧
                    if (count < 5) {
                        expect(typeof model.model.info.data?.a).toBe('string');
                        expect(typeof model.model.data.value?.a).toBe('string');

                        expect(model.model.info.data?.a).toBe('4');
                        expect(model.model.data.value?.a).toBe('4');

                        expect(model.model.info.data?.b).toBe('4');
                        expect(model.model.data.value?.b).toBe('4');
                        model.model.refetch();
                    } else {
                        expect(model.model.info.data?.a).toBe('5');
                        expect(model.model.data.value?.a).toBe('5');

                        expect(model.model.info.data?.b).toBe('5');
                        expect(model.model.data.value?.b).toBe('5');

                        expect(model.info.data?.test).toBe('1');
                        expect(model.data.value?.test).toBe('1');
                        resolve(true);
                    }
                });

                onMounted(() => {
                    expect(typeof model.model.info.data).toBe('undefined');
                    expect(typeof model.model.data.value).toBe('undefined');

                    expect(typeof model.info.data).toBe('undefined');
                    expect(typeof model.data.value).toBe('undefined');
                    model.refetch();

                    setTimeout(() => {
                        model.model.testVariables.value = '123';
                    }, 100);
                })
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
                        hydrationStatus: ref(2),
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
