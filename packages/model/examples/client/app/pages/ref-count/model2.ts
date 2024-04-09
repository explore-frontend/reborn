import { createModel, useModel, useRestQuery } from '../../../../../src';
import { ref, computed, version, watch } from 'vue-demi';

export const TestModel = createModel(() => {
    console.log('vue version', version);
    const a = ref(1);
    const b = computed(() => a.value * 2);
    const c = ref(1);

    const add = () => a.value++;
    watch(a, (a) => {
        console.log(a, 'add');
        return
    });
    return {
        a,
        add,
    };
});


export const WrapModel = createModel(() => {
    console.log('create Wrap')
   return useModel(TestModel)
});
