import {
    createRouter as createVueRouter,
    createMemoryHistory,
    createWebHistory,
    type RouteRecordRaw
} from 'vue-router'

const routes: RouteRecordRaw[]  = [{
    path: '/:pathMatch(.*)*',
    component: () => import('./pages/index.vue'),
}];

export function createRouter() {
    const env = typeof window;
    return createVueRouter({
        // use appropriate history implementation for server/client
        // import.meta.env.SSR is injected by Vite.
        history: env === 'undefined'
            ? createMemoryHistory('/test/')
            : createWebHistory('/test/'),
        routes,
    });
}