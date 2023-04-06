import { readFileSync } from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve} from 'path';
import { createServer } from 'vite';

(async () => {
    const app = express()
    // Create Vite server in middleware mode and configure the app type as
    // 'custom', disabling Vite's own HTML serving logic so parent server
    // can take control
    const vite = await createServer({
        server: {
            middlewareMode: true
        },
        appType: 'custom'
    })
    // Use vite's connect instance as middleware. If you use your own
    // express router (express.Router()), you should use router.use
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
            // serve index.html - we will tackle this next
            const htmlTemplate = readFileSync(
                resolve(__dirname, '../index.html'),
                'utf-8',
            );

            const template = await vite.transformIndexHtml(url, htmlTemplate);
            const { render } = await vite.ssrLoadModule('/examples/client/entry-server.ts');
            const appHtml = await render(url);
            const html = template.replace(`<!--vue-ssr-outlet-->`, appHtml);
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e) {
            // If an error is caught, let Vite fix the stack trace so it maps back
            // to your actual source code.
            vite.ssrFixStacktrace(e as Error)
            next(e)
          }
    });

    app.listen(5173);
    console.log('server start at 5173, use link http://localhost:5173')
})();