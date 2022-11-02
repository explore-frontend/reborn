import { createApp, h } from 'vue';

import { createStore, createClient } from '../src/index';
import App from './App.vue';

const store = createStore();
const restClient = createClient('REST');

store.registerClient('REST', restClient);

const app = new Vue({
    render: () => h(App),
});
app.use(store);
app.mount('#app');