import { createModel, useRestQuery } from '../../src';
import { ref, computed } from 'vue-demi';

export const TestModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);
    const c = ref(1);
    const { data, stream$ } = useRestQuery<{result: 1, data: number}>({
        url: '/api',
        method: 'post',
        variables() {
            console.error('啦啦啦啦啦');
            return {
                params: b.value
            };
        },
    });

    stream$.subscribe(sub => {
        console.log(sub)
    })

    return {
        data,
        a,
        b,
        c,
    };
});
