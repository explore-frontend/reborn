import { createModel, useRestQuery } from '../../../src';
import { ref, computed, version } from 'vue-demi';

export const TestModel = createModel(() => {
    console.log('vue version', version)
    const a = ref(1);
    const b = computed(() => a.value * 2);
    const c = ref(1);
    const { data, stream$ } = useRestQuery<{result: 1, data: number}>({
        url: '/api',
        method: 'post',
        variables() {
            console.error('啦啦啦啦啦');
            return {
                params: c.value
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
