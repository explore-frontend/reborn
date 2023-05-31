import { createModel, useRestQuery } from '../../src';
import { ref, computed } from 'vue-demi';

export const TestModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);
    const { data } = useRestQuery<{result: 1, data: number}>({
        url: '/api'
    });

    return {
        data,
        a,
        b,
    };
});