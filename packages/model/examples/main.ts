import Vue, { h } from 'vue';

import { createStore, createClient } from '../src/index';
import App from './App.vue';

const store = createStore();
const restClient = createClient('REST');

store.registerClient('REST', restClient);
Vue.use(store);

const app = new Vue({
    render: () => h(App),
});
app.$mount('#app')