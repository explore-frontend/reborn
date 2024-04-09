export const routes = [
    {
        path: '/ref-count',
        name: 'ref-count',
        component: () => import('./pages/ref-count/index.vue'),
    },
    {
        path: '/family',
        name: 'family',
        component: () => import('./pages/family/index.vue'),
    },
    {
        path: '/*',
        name: 'default',
        component: () => import('./pages/request/index.vue'),
    },
];
