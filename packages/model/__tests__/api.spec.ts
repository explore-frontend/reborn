/**
 * @vitest-environment jsdom
 */
import type { storeFactory } from '../src/store';

import { describe, it, expect } from 'vitest';
import Vue, { defineComponent, ref, computed, h, getCurrentInstance, nextTick } from 'vue';
import { compileToFunctions } from 'vue-template-compiler';

import { createModel } from '../src/model';
import { useModel, createStore } from '../src/api';
import { getRootStore } from '../src/const';


const testModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);

    return {
        a,
        b,
    };
});


let currentComponentAInstance: ReturnType<typeof getCurrentInstance> | null;
const ComponentA = defineComponent({
    ...compileToFunctions('<div>A: a: {{ model.a.value }} b: {{ model.b.value }}</div>'),
    setup() {
        currentComponentAInstance = getCurrentInstance();
        const model = useModel(testModel);

        function handleClick() {
            model.a.value++;
        }

        return {
            model,
            handleClick,
        };
    },
});

let currentComponentBInstance: ReturnType<typeof getCurrentInstance> | null;
const ComponentB = defineComponent({
    ...compileToFunctions('<div>B: a: {{ model.a.value }} b: {{ model.b.value }}</div>'),
    setup() {
        currentComponentBInstance = getCurrentInstance();
        const model = useModel(testModel);

        function handleClick() {
            model.a.value++;
        }

        const c = computed(() => model.b.value);

        return {
            model,
            handleClick,
            c,
        };
    },
});

let currentAppInstance: ReturnType<typeof getCurrentInstance> | null;
let currentStore: ReturnType<typeof storeFactory> | null;

const App = defineComponent({
    components: {
        ComponentA,
        ComponentB,
    },
    ...compileToFunctions(`<div v-if="parentShow"><ComponentA v-if="show" /><ComponentB v-else /></div>`),
    setup() {
        currentAppInstance = getCurrentInstance();
        currentStore = getRootStore().store;
        const show = ref(false);
        const parentShow = ref(true);

        function change() {
            show.value = !show.value;
        }

        function toggle() {
            parentShow.value = !parentShow.value;
        }

        return {
            show,
            parentShow,
            change,
            toggle,
        };
    },
});

describe(`model should has it's own effect scope`, () => {
    it('state between two component should has own effect scope', () => new Promise(resolve => {
        const store = createStore();
        Vue.use(store);

        const app = new Vue({
            render: () => h(App)
        });

        const div = document.createElement('div');
        app.$mount(div);
        (async () => {
            expect(currentAppInstance?.proxy.$el.innerHTML).toBe('<div>B: a: 1 b: 2</div>')
            expect(currentComponentBInstance?.proxy.$el.innerHTML).toBe('B: a: 1 b: 2');
            // @ts-ignore
            currentComponentBInstance?.proxy.handleClick();
            await nextTick();
            expect(currentAppInstance?.proxy.$el.innerHTML).toBe('<div>B: a: 2 b: 4</div>')
            expect(currentComponentBInstance?.proxy.$el.innerHTML).toBe('B: a: 2 b: 4');

            const model = currentStore?.getModelInstance(testModel);
            expect(model?.a.value).toBe(2);
            expect(model?.b.value).toBe(4);

            // @ts-ignore
            currentAppInstance?.proxy.change();
            await nextTick();
            expect(currentAppInstance?.proxy.$el.innerHTML).toBe('<div>A: a: 2 b: 4</div>')
            expect(currentComponentAInstance?.proxy.$el.innerHTML).toBe('A: a: 2 b: 4');

            // @ts-ignore
            currentComponentAInstance?.proxy.handleClick();
            await nextTick();
            expect(currentAppInstance?.proxy.$el.innerHTML).toBe('<div>A: a: 3 b: 6</div>')
            expect(currentComponentAInstance?.proxy.$el.innerHTML).toBe('A: a: 3 b: 6');

            const model1 = currentStore?.getModelInstance(testModel);
            expect(model1?.a.value).toBe(3);
            expect(model1?.b.value).toBe(6);

            // @ts-ignore
            currentAppInstance?.proxy.toggle();
            await nextTick();

            const model2 = currentStore?.getModelInstance(testModel);
            expect(model2).toBe(undefined);

            resolve(true);
        })();
    }));
});

