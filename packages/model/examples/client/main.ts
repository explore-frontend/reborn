import { createSSRApp, h } from 'vue';

import { createStore, createClient } from '../../src/index';
import App from './App.vue';
import { createRouter } from './router';

export function createApp() {
    const router = createRouter();
    const store = createStore();
    const restClient = createClient('REST');
    store.registerClient('REST', restClient);
    const app = createSSRApp({
        render: () => h(App),
    });

    app.use(store);
    app.use(router);

    return { app, router }
}