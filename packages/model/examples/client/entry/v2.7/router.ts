
import type { RouteConfig } from 'vue-router3';
import VueRouter from 'vue-router3';
import Vue from 'vue2.7';
Vue.use(VueRouter);
const routes: RouteConfig[]  = [{
    path: '/*',
    component: () => import('../../app/pages/index.vue'),
}];


export function createRouter() {
    return new VueRouter({
        base: '/test/',
        mode: 'history',
        routes,
    });
}
