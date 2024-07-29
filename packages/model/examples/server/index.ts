import { readFileSync } from 'fs';
import express from 'express';
import { resolve } from 'path';
import { createServer } from 'vite';
import { mockAPI } from './mockAPI/index';
import { type Readable } from 'stream';

const vueVersion = process.env.VUE_VERSION === '2.7' ? '2.7' : '3';
const port = vueVersion === '2.7' ? 5173 : 5174;
(async () => {
    const app = express();
    // Create Vite server in middleware mode and configure the app type as
    // 'custom', disabling Vite's own HTML serving logic so parent server
    // can take control
    const vite = await createServer({
        server: {
            middlewareMode: true,
        },
        appType: 'custom',
    });
    // Use vite's connect instance as middleware. If you use your own
    // express router (express.Router()), you should use router.use
    app.use('/api', mockAPI);
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        // 没引入CDN的favicon，所以这里绕一下先
        if (url === '/favicon.ico') {
            res.end('');
            next();
            return;
        }
        try {
            // serve index.html - we will tackle this next
            const htmlTemplate = readFileSync(resolve(__dirname, '../index.html'), 'utf-8').replace(
                '%version%',
                vueVersion,
            );
            if (req.query.csr) {
                console.error('CSR', url);
                res.status(200).set({ 'Content-Type': 'text/html' }).end(htmlTemplate);
                next();
                return;
            }
            console.error('SSR', url);

            const template = await vite.transformIndexHtml(url, htmlTemplate);

            const { render } = await vite.ssrLoadModule(`/examples/client/entry/v${vueVersion}/entry-server.ts`);
            const [stream, cache, getCache, ssrContext]: [Readable, any, any, any] = await render(url);
            res.set({ 'Content-Type': 'text/html' });
            res.write(`<!DOCTYPE html>
<head>
    <meta charset="utf-8">
    <title>测试页面</title>
</head>
<body>
    <div id="app">`);

            stream.pipe(res, { end: false });

            stream.on('data', (d) => {
                // console.log('ddd', d.toString());
            });

            stream.on('end', () => {

                console.log('telep', ssrContext.teleports)


                res.write('\n<div id="add">')
                Object.values(ssrContext.teleports ?? {}).forEach(s => {
                    res.write(s)
                })
                res.write('</div>\n');

                res.write('</div>\n');

                getCache().then((cache: any) => {
                    res.write(`<script>window.INIT_STATE = ${cache}</script>`);
                    res.end(
                        `<script type="module" src="/examples/client/entry/v%version%/entry-client.ts"></script>
</body>`.replace('%version%', vueVersion),
                    );
                });
            });
        } catch (e) {
            // If an error is caught, let Vite fix the stack trace so it maps back
            // to your actual source code.
            vite.ssrFixStacktrace(e as Error);
            next(e);
        }
    });

    app.listen(port);
    console.log(`server start at ${port}, use link http://localhost:${port}`);
})();
