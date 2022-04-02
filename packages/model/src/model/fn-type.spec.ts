/**
 * @jest-environment jsdom
 */
import { useRestQuery, createModel, createModelFromCA } from './fn-type';
import {
    Vue,
    CompositionAPI,
    defineComponent,
    onMounted,
    createApp,
    watch,
    h,
} from '../dep';
import { createClient } from '../clients';
import fetchMock from 'jest-fetch-mock';
import 'unfetch/polyfill'
import { getCurrentInstance, ref } from '@vue/composition-api';
import { type } from 'os';

Vue.use(CompositionAPI);
fetchMock.enableMocks();

const restClient = createClient('REST', {
    method: 'get',
});

let count = 0;
restClient.interceptors.response.use((params) => {
    if (params.config.url === '/') {
        ++count;
        return {
            a: `${count}`,
            b: `${count}`,
        };
    }
    return params;
});

describe('transform model success', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.doMock();
    });

    const MockModel = createModel(() => {
        const testVariablels = ref('1');
        const query = useRestQuery<{
            a: string;
            b: string;
        }>({
            url: '/',
            variables() {
                return {
                    mockData: testVariablels.value,
                };
            },
            skip() {
                return !testVariablels.value;
            },
        });

        return {
            info: query.info,
            testVariablels,
        };
    });

    it('transform fn type model', done => {
        const div = document.createElement('div');
        const App = defineComponent({
            setup() {

                const params = createModelFromCA(MockModel);
                const vm = getCurrentInstance()!;
                fetchMock.mockResponseOnce(JSON.stringify({
                    a: 1,
                    b: 1,
                }));

                // 手动mock一下
                vm.proxy.$root.rebornStore = {
                    getModelInstance: jest.fn(),
                    registerModel: jest.fn(),
                    restore: jest.fn(),
                    exportStates: jest.fn(),
                };

                vm.proxy.$root.rebornClient = {
                    rest: restClient,
                };

                const { model } = params.cotr();

                watch(() => model.info.data?.b, () => {
                    expect(typeof model.info.data?.a).toBe('string');
                    expect(model.info.data?.a).toBe(model.info.data?.b);
                    model.testVariablels.value = '';
                    if (model.info.data?.a === '2') {
                        done();
                    }
                });

                onMounted(() => {
                    setTimeout(() => {
                        model.testVariablels.value = '123';
                    }, 300);
                })
                return () => null;
            }
        });

        createApp({
            render: () => h(App)
        }).mount(div);
    });
});
