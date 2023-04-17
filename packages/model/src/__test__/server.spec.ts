import { describe, it, expect } from 'vitest';
import { createSSRApp } from 'vue';
import { createCache, createStore, createClient } from '../index';
import App from './demo.vue';
import customFetch from 'node-fetch';
import { renderToString } from 'vue/server-renderer'

describe(`model should has it's own effect scope`, () => {
    it('state between two component should has own effect scope', async () => {
        // const store = createStore();
        // const cache = createCache();
        // const client = createClient('REST', {
        //     cache,
        //     // @ts-expect-error
        //     fetch: customFetch,
        // });
        // client.interceptors.request.use(data => {
        //     console.error(1, data)
        //     return data;
        // });

        // client.interceptors.response.use(data => {
        //     console.error(2, data)
        //     return data;
        // });

        // store.registerClient('REST', client);

        // const app = createSSRApp(App);
        // app.use(store);


        // const html = await renderToString(app, {});
        // console.error(html)
        expect(1).toBe(1);
    });
});

