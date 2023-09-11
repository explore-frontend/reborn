import { createModel, useRestQuery } from '../../../src';
import { ref, computed, version } from 'vue-demi';

export const TestModel = createModel(() => {
    console.log('vue version', version)
    const a = ref(1);
    const b = computed(() => a.value * 2);
    const c = ref(1);
    const { data, stream$ } = useRestQuery<{result: 1, data: number}, {params: number}>({
        url: '/api',
        method: 'post',
        variables(route) {
            // 这行检查route 的类型
            route.fullPath satisfies string;
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
