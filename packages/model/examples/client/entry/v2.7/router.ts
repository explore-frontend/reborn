
import VueRouter from 'vue-router3';
import Vue from 'vue2.7';
import {routes} from '../../app/routes'
Vue.use(VueRouter);


export function createRouter() {
    return new VueRouter({
        base: '/test/',
        mode: 'history',
        routes,
    });
}
