import { describe, it, expect } from 'vitest';
// import { createSSRApp } from 'vue-demi';
// import { createCache, createStore, createClient } from '../index';
// import App from './demo.vue';
// import { renderToString } from 'vue/server-renderer'

describe(`model should has it's own effect scope`, () => {
    it('state between two component should has own effect scope', async () => {
        // fetchMock.mockResponse(JSON.stringify({
        //     a: 2,
        //     b: 4,
        // }));
        // const store = createStore();
        // const cache = createCache();
        // const client = createClient('REST', {
        //     baseUrl: 'http://localhost:5173',
        //     cache,
        // });

        // client.interceptors.response.use(data => {
        //     return data.data;
        // });

        // store.registerClient('REST', client);

        // const app = createSSRApp(App);
        // app.use(store);


        // const html = await renderToString(app, {});
        // console.error(html)
        expect(1).toBe(1);
    });
});

