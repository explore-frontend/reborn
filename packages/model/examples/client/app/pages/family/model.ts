import { createModel, createModelFamily, useModel, useRestQuery } from '../../../../../src';
import { ref } from 'vue-demi';

export const TestModelFamily = createModelFamily((id: number) => () => {
    const { msg } = useModel(InnerModelFamily(id + 10));
    const { msg: globalMsg } = useModel(InnerModelFamily(0));
    const add = () => {
        msg.value++;
        globalMsg.value++;
    };

    const { data } = useRestQuery<{ result: 1; data: number }, any>({
        url: '/api',
        method: 'get',
        variables() {
            return {
                id: id,
            };
        },
    });
    return {
        msg,
        globalMsg,
        add,
        data,
    };
});

// 检测 model 多实例嵌套的 useQuery
export const HomeModel = createModel(() => {
    const { data } = useRestQuery<{ result: 1; data: number }, { params: string }>({
        url: '/api',
        method: 'get',
        variables(route) {
            return {
                params: 'home',
            };
        },
    });

    return { data };
});

const InnerModelFamily = createModelFamily((id: number) => () => {
    const msg = ref(id);
    return {
        msg,
    };
});
