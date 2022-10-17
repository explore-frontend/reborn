import Vue, { h } from 'vue';

import { createStore } from '../src/api';
import App from './App.vue';

const store = createStore();
Vue.use(store);

const app = new Vue({
    render: () => h(App),
});
app.$mount('#app')