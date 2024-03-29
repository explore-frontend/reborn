import { createApp } from './main';

const { app, router, cache } = createApp();
// @ts-expect-error
cache.restore(window.INIT_STATE);
// wait until router is ready before mounting to ensure hydration match
console.log(router)
router.onReady(() => {
    console.log('hydrated');
    app.$mount('#app', true)
})

