import { createApp as createSSRApp, h } from 'vue-demi';
import VueRouter from 'vue-router';

import { createStore, createClient, createCache } from '../../src/index';
import App from './App.vue';
import { createRouter } from './router';

type Fetch = typeof fetch

export function createApp(customFetch?: Fetch) {
    const router = createRouter();
    const store = createStore();
    const cache = createCache();

    const f = customFetch || window.fetch.bind(window);
    const restClient = createClient('REST', {
        baseUrl: 'http://localhost:5173',
        fetch: f,
        cache,
    });

    restClient.interceptors.response.use(res => {
        return res.data;
    });

    store.registerClient('REST', restClient);
    const app = createSSRApp({
        router,
        render: () => h(App),
    });

    app.use(VueRouter);
    app.use(store);

    return { app, router, cache };
}