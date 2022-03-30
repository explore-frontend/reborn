/**
 * @jest-environment jsdom
 */
import type { QueryResult } from '../operations/types';

import { createModelFromClass, BaseModel } from './class-type';
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
import { restQuery } from '../operations/decorators';
import 'unfetch/polyfill'

Vue.use(CompositionAPI);
fetchMock.enableMocks();

class CustomModel extends BaseModel {
    private a = 1;

    get b() {
        return this.a + 1;
    }

    set b(value: number) {
        this.a = value - 1;
    }

    add(num: number) {
        this.a += num;
    }

    min = (num: number) => {
        this.a -= num;
    }

    @restQuery<CustomModel>({
        url: '/query',
        variables() {
            return {
                a: this.a,
            };
        },
        skip() {
            return this.a === 1;
        }
    })
    private query!: QueryResult<{
        a: number;
        b: number;
    }>;

    get data() {
        return this.query.data;
    }

    get loading() {
        return this.query.loading;
    }

    get error() {
        return this.query.error;
    }

    refetch() {
        return this.query.refetch();
    }

    c = 10;
};

const restClient = createClient('rest', {
    method: 'get',
});

const gqlClient = createClient('gql', {
    url: './',
    method: 'post',
});

class CustomClassWithExtends extends CustomModel {
    get d() {
        return this.b + 10;
    }

    @restQuery<CustomClassWithExtends>({
        url: '/query1',
        variables() {
            return {
                d: this.d,
            };
        },
        skip() {
            return this.d === 12;
        }
    })
    private query1!: QueryResult<{
        a: number;
        b: number;
    }>;

    get data1() {
        return this.query1.data;
    }

    get loading1() {
        return this.query1.loading;
    }

    get error1() {
        return this.query1.error;
    }
}

describe('transform model success', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.doMock();
    });

    it('transform classModel', done => {
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
                    done();
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

        createApp({
            render: () => h(App)
        }).mount(div);
    });

    it('transform classModel with extends', done => {
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
                    done();
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
                });

                return () => null;
            }
        });

        createApp({
            render: () => h(App)
        }).mount(div)
    });
});