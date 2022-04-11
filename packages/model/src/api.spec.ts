/**
 * @jest-environment jsdom
 */
import type { ComponentInternalInstance } from '@vue/composition-api';

import { createModel } from './model';
import { useModel, createStore } from './api';
import CompositionAPI, { defineComponent, ref, computed, createApp, h, getCurrentInstance, nextTick } from '@vue/composition-api';
// 为了测试简单些，引一个带编译的Vue进来
// @ts-ignore
import Vue from 'vue/dist/vue.js';

Vue.use(CompositionAPI);

const testModel = createModel(() => {
    const a = ref(1);
    const b = computed(() => a.value * 2);

    return {
        a,
        b,
    };
});


let currentComponentAInstance: ComponentInternalInstance | null;
const ComponentA = defineComponent({
    template: '<div>A: a: {{ model.a.value }} b: {{ model.b.value }}</div>',
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

let currentComponentBInstance: ComponentInternalInstance | null;
const ComponentB = defineComponent({
    template: '<div>B: a: {{ model.a.value }} b: {{ model.b.value }}</div>',
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

let currentAppInstance: ComponentInternalInstance | null;

const App = defineComponent({
    components: {
        ComponentA,
        ComponentB,
    },
    template: `
        <div v-if="parentShow"><ComponentA v-if="show" /><ComponentB v-else /></div>
    `,
    setup() {
        currentAppInstance = getCurrentInstance();
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
    it('state between two component should has own effect scope', done => {
        const store = createStore();
        const app = createApp({
            render: () => h(App),
        });

        store.install(Vue, app);
        const div = document.createElement('div');
        app.mount(div);
        (async () => {
            expect(currentAppInstance?.proxy.$el.innerHTML).toBe('<div>B: a: 1 b: 2</div>')
            expect(currentComponentBInstance?.proxy.$el.innerHTML).toBe('B: a: 1 b: 2');
            // @ts-ignore
            currentComponentBInstance?.proxy.handleClick();
            await nextTick();
            expect(currentAppInstance?.proxy.$el.innerHTML).toBe('<div>B: a: 2 b: 4</div>')
            expect(currentComponentBInstance?.proxy.$el.innerHTML).toBe('B: a: 2 b: 4');

            // @ts-ignore
            const model = store.storeInstance.getModelInstance(testModel);
            expect(model.a.value).toBe(2);
            expect(model.b.value).toBe(4);

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

            // @ts-ignore
            const model1 = store.storeInstance.getModelInstance(testModel);
            expect(model1.a.value).toBe(3);
            expect(model1.b.value).toBe(6);

            // @ts-ignore
            currentAppInstance?.proxy.toggle();
            await nextTick();

            // @ts-ignore
            const model2 = store.storeInstance.getModelInstance(testModel);
            expect(model2).toBe(undefined);

            done();
        })();
    });
});

