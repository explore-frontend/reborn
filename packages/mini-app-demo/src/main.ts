import { createSSRApp } from 'vue';
import { createStore, createClient } from '@kwai-explore/model';

import App from './App.vue';

function parseResponse(url: string, res: any) {
    let header = res.header || {};
    header = Object.keys(header).reduce((map: { [key: string]: string }, key) => {
        map[key.toLowerCase()] = header[key];
        return map;
    }, {});
    return {
        ok: 200 <= res.statusCode && res.statusCode <= 299, // 200-299
        status: res.statusCode,
        statusText: String(res.statusCode),
        url,
        clone: () => parseResponse(url, res),
        text: () => Promise.resolve(typeof res.data === 'string' ? res.data : JSON.stringify(res.data)),
        json: () => {
            if (typeof res.data === 'object' && !(res.data instanceof ArrayBuffer)) return Promise.resolve(res.data);
            let json = {};
            try {
                json = JSON.parse(res.data);
            } catch (err) {
                console.error(err);
            }
            return Promise.resolve(json);
        },
        arrayBuffer: () => {
            return Promise.resolve(res.data);
        },
        headers: {
            keys: () => Object.keys(header),
            entries: () => {
                const all = [];
                for (const key in header) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (header.hasOwnProperty(key)) {
                        all.push([key, header[key]]);
                    }
                }
                return all;
            },
            get: (n: string) => header[n.toLowerCase()],
            has: (n: string) => n.toLowerCase() in header,
        },
    };
}


function fetch(url: string, options: any) {
    options = options || {};
    return new Promise((resolve, reject) => {
        // @ts-expect-error
        wx.request({
            url: url.startsWith('https://') || url.startsWith('http://') ? url : `http://localhost:5173${url}`,
            method: options.method || 'POST',
            data: options.body,
            header: options.headers,
            dataType: 'text',
            responseType: 'text',
            success: (resp: any) => {
                resolve(parseResponse(url, resp));
            },
            fail: (err: any) => {
                reject(err);
            },
        });
    });
}

export function createApp() {
    const app = createSSRApp(App);

    const store = createStore();

    const restClient = createClient('REST', {
        // @ts-expect-error
        fetch,
    });

    restClient.interceptors.response.use(data => {
        return data.data;
    });

    store.registerClient(restClient);

    app.use(store);

    return {
        app,
    };
}
