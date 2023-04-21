/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { createApp, h, nextTick } from 'vue';

import { createClient, createStore } from '../index';

import App from './App.vue';
import { TestModel } from './test-model';

import 'unfetch/polyfill';

describe(`model should has it's own effect scope`, () => {
    it('state between two component should has own effect scope', () => new Promise(resolve => {
        const store = createStore();
        const client = createClient('REST');

        store.registerClient('REST', client);

        const app = createApp({
            render: () => h(App)
        });

        app.use(store);

        const div = document.createElement('div');
        const appEl = app.mount(div).$el as HTMLDivElement;

        (async () => {
            expect(appEl.outerHTML).toBe('<div class="app"><div class="b">B: a: 1 b: 2</div></div>')

            div.querySelector('.b')?.dispatchEvent(new Event('click'));
            await nextTick();
            expect(appEl.outerHTML).toBe('<div class="app"><div class="b">B: a: 2 b: 4</div></div>');

            div.querySelector('.app')?.dispatchEvent(new Event('click'));
            await nextTick();
            expect(appEl.outerHTML).toBe('<div class="app"><div class="a">A: a: 1 b: 2</div></div>')

            div.querySelector('.a')?.dispatchEvent(new Event('click'));
            await nextTick();
            expect(appEl.outerHTML).toBe('<div class="app"><div class="a">A: a: 2 b: 4</div></div>')

            div.querySelector('.app')?.dispatchEvent(new Event('keypress'));
            await nextTick();

            const model2 = app.config.globalProperties.rebornStore.getModelInstance(TestModel);
            expect(model2).toBe(undefined);

            resolve(true);
        })();
    }));
});

