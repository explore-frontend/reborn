import { createSSRApp, h } from 'vue-demi';

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

    store.registerClient(restClient);
    const app = createSSRApp({
        render: () => h(App),
    });

    app.use(store, customFetch && true);
    app.use(router);

    return { app, router, cache };
}
