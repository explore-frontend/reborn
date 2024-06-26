import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'
import fetch from 'node-fetch';

export async function render(url: string) {
    // 妈的，fetch的Request类型不一致，所以还不能直接用……
    // @ts-expect-error
    const { app, router, cache } = createApp(fetch);

    // set the router to the desired URL before rendering
    await router.push(url.replace('/test/', ''))
    await router.isReady();

    // passing SSR context object which will be available via useSSRContext()
    // @vitejs/plugin-vue injects code into a component's setup() that registers
    // itself on ctx.modules. After the render, ctx.modules would contain all the
    // components that have been instantiated during this render call.
    const ctx = {}
    const html = await renderToString(app, ctx);

    // the SSR manifest generated by Vite contains module -> chunk/asset mapping
    // which we can then use to determine what files need to be preloaded for this
    // request.
    return [
        html,
        cache.extract(),
    ];
}
