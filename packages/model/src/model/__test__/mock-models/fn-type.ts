import { ref } from 'vue';
import { useRestQuery, createModel, createModelFromCA } from '../../fn-type';

export const MockModel = createModel(() => {
    const testVariables = ref('1');
    const query = useRestQuery<{
        a: string;
        b: string;
    }>({
        url: '/',
        method: 'POST',
        timeout: 5000,
        variables() {
            return {
                mockData: testVariables.value,
            };
        },
        skip() {
            return !testVariables.value;
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
        timeout: 1000,
    });

    return {
        info: query.info,
        loading: query.loading,
        error: query.error,
        data: query.data,
        status: query.status,
        testVariables,
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