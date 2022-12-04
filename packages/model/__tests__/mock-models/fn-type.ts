import { ref } from 'vue';
import { useRestQuery, createModel, createModelFromCA } from '../../src/model/fn-type';

export const MockModel = createModel(() => {
    const testVariablels = ref('1');
    const query = useRestQuery<{
        a: string;
        b: string;
    }>({
        url: '/',
        method: 'POST',
        variables() {
            return {
                mockData: testVariablels.value,
            };
        },
        skip() {
            return !testVariablels.value;
        },
        updateQuery(before, after) {
            return {
                a: '' + before?.a + after?.a,
                b: '' + before?.b + after?.b,
            };
        }
    });

    const query1 = useRestQuery<{
        a: string;
        b: string;
    }>({
        url: '/test',
        headers: {
            "content-type": 'application/json'
        },
        skip: true,
    });

    return {
        info: query.info,
        loading: query.loading,
        error: query.error,
        data: query.data,
        status: query.status,
        testVariablels,
        fetchMore: query.fetchMore,
        refetch: query1.refetch,
    };
});

export const MockComposeModel = createModel(() => {
    const { model } = createModelFromCA(MockModel).cotr();

    const query = useRestQuery<{
        test: string,
    }>({
        url: '/test-compose',
        headers: {
            "content-type": 'application/json'
        },
        skip: true,
    });

    return {
        model,
        refetch: query.refetch,
        info: query.info,
        data: query.data,
        loading: query.loading,
        error: query.error,
    };
});