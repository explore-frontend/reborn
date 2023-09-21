// TODO后面再改一下Model的开发模式
import { createModel, useRestQuery } from '@kwai-explore/model';
import { ref, computed } from 'vue';

export const TestModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);
    const c = ref(1);
    const { data } = useRestQuery<{result: 1, data: number}>({
        url: '/api',
        method: 'post',
        variables() {
            console.error('啦啦啦啦啦');
            return {
                params: c.value
            };
        },
    });

    return {
        data,
        a,
        b,
        c,
    };
});
