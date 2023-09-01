import { Vue, createApp as createSSRApp, h } from 'vue-demi';

import { createStore, createClient, createCache } from '../../../../src/index';
import App from '../../app/App.vue';
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
    Vue.use(store);
    const app = new Vue({
        router,
        render: () => h(App),
    });


    console.log(app)

    return { app, router, cache };
}
