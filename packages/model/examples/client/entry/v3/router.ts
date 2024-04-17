import {
    createRouter as createVueRouter,
    createMemoryHistory,
    createWebHistory,
} from 'vue-router4'
import {routes} from '../../app/routes'


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
