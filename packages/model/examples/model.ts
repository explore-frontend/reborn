import { createModel } from '../src/model';
import { ref, computed} from 'vue';

export const TestModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);

    return {
        a,
        b,
    };
});