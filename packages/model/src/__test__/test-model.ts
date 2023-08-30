import { createModel, useRestQuery } from '../index';
import { ref, computed } from 'vue-demi';


export const TestModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);

    const { data, loading, error, status } = useRestQuery<{a: number, b: number}>({
        url: '/testApi2121',
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