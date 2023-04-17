import { createModel, useRestQuery } from '../index';
import { ref, computed } from 'vue';


export const TestModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);
    fetchMock.mockResponse(JSON.stringify({
        a: 2,
        b: 4,
    }));

    const { data, loading, error, status } = useRestQuery<{a: number, b: number}>({
        url: '/testApi',
        method: 'post',
        variables() {
            return {
                number: a.value,
            };
        },
    });

    return {
        a,
        b,
        status,
        data,
        loading,
        error,
    };
});